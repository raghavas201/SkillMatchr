import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { triggerMatch } from '../lib/mlClient';

const router = Router();

// ──────────────────────────────────────────────────────────────
// POST /api/jobs — create a job description
// ──────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response) => {
    const { title, company, content } = req.body as {
        title: string; company?: string; content: string;
    };

    if (!title?.trim() || !content?.trim()) {
        res.status(400).json({ error: 'title and content are required' });
        return;
    }

    const result = await query(
        `INSERT INTO job_descriptions (user_id, title, company, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [req.user!.id, title.trim(), company?.trim() ?? null, content.trim()]
    );

    res.status(201).json({ job: result.rows[0] });
});

// ──────────────────────────────────────────────────────────────
// GET /api/jobs — list user's JDs with match counts
// ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const result = await query(
        `SELECT jd.*,
            COUNT(jm.id)::int AS match_count,
            MAX(jm.created_at) AS last_matched_at
     FROM job_descriptions jd
     LEFT JOIN jd_matches jm ON jm.jd_id = jd.id
     WHERE jd.user_id = $1
     GROUP BY jd.id
     ORDER BY jd.created_at DESC`,
        [req.user!.id]
    );
    res.json({ jobs: result.rows });
});

// ──────────────────────────────────────────────────────────────
// GET /api/jobs/:id — JD + ranked match results
// ──────────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;

    const jdResult = await query(
        'SELECT * FROM job_descriptions WHERE id = $1 AND user_id = $2',
        [id, req.user!.id]
    );
    if (jdResult.rows.length === 0) {
        res.status(404).json({ error: 'Job description not found' });
        return;
    }

    const matchResult = await query(
        `SELECT jm.*,
            r.original_name, r.file_type, r.uploaded_at,
            a.extracted_skills, a.ats_score, a.quality_score, a.strength
     FROM jd_matches jm
     JOIN resumes r ON r.id = jm.resume_id
     LEFT JOIN analyses a ON a.resume_id = jm.resume_id
     WHERE jm.jd_id = $1
     ORDER BY jm.hiring_probability DESC, jm.similarity_score DESC`,
        [id]
    );

    res.json({ job: jdResult.rows[0], matches: matchResult.rows });
});

// ──────────────────────────────────────────────────────────────
// POST /api/jobs/:id/match — trigger ML match for all user resumes
// ──────────────────────────────────────────────────────────────
router.post('/:id/match', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;

    const jdResult = await query(
        'SELECT * FROM job_descriptions WHERE id = $1 AND user_id = $2',
        [id, req.user!.id]
    );
    if (jdResult.rows.length === 0) {
        res.status(404).json({ error: 'Job description not found' });
        return;
    }

    const jd = jdResult.rows[0] as {
        id: string; content: string; title: string;
    };

    // Fetch all done resumes for this user with their analysis
    const resumesResult = await query(
        `SELECT r.id, r.original_name,
            a.extracted_skills, a.ats_score, a.quality_score, a.raw_result
     FROM resumes r
     JOIN analyses a ON a.resume_id = r.id
     WHERE r.user_id = $1 AND r.status = 'done'`,
        [req.user!.id]
    );

    if (resumesResult.rows.length === 0) {
        res.status(400).json({ error: 'No analyzed resumes found. Upload and analyze resumes first.' });
        return;
    }

    // Clear previous matches for this JD
    await query('DELETE FROM jd_matches WHERE jd_id = $1', [id]);

    // Trigger async ML matching (non-blocking)
    void triggerMatch(jd.id, jd.content, resumesResult.rows as unknown as Parameters<typeof triggerMatch>[2]);

    res.json({
        message: `Matching ${resumesResult.rows.length} resume(s) against "${jd.title}". Results will appear shortly.`,
        resume_count: resumesResult.rows.length,
    });
});

// ──────────────────────────────────────────────────────────────
// POST /api/jobs/:id/match-result — ML callback
// ──────────────────────────────────────────────────────────────
router.post('/:id/match-result', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { matches, error } = req.body as {
        matches?: Array<{
            resume_id: string;
            similarity_score: number;
            hiring_probability: number;
            matched_keywords: string[];
            skill_gaps: string[];
            rank: number;
            role_prediction: string;
            anomalies: string[];
            explanation: Record<string, number>;
        }>;
        error?: string;
    };

    if (error) {
        console.error(`[JD Match] Error for job ${id}:`, error);
        res.json({ ok: true });
        return;
    }

    if (!matches || matches.length === 0) {
        res.json({ ok: true });
        return;
    }

    // Bulk insert match results
    for (const m of matches) {
        await query(
            `INSERT INTO jd_matches
         (resume_id, jd_id, similarity_score, hiring_probability,
          skill_gaps, matched_keywords, rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (resume_id, jd_id) DO UPDATE SET
         similarity_score   = EXCLUDED.similarity_score,
         hiring_probability = EXCLUDED.hiring_probability,
         skill_gaps         = EXCLUDED.skill_gaps,
         matched_keywords   = EXCLUDED.matched_keywords,
         rank               = EXCLUDED.rank,
         created_at         = NOW()`,
            [
                m.resume_id, id,
                m.similarity_score, m.hiring_probability,
                JSON.stringify(m.skill_gaps ?? []),
                JSON.stringify(m.matched_keywords ?? []),
                m.rank,
            ]
        );
    }

    res.json({ ok: true, saved: matches.length });
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/jobs/:id
// ──────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await query(
        'DELETE FROM job_descriptions WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user!.id]
    );
    if (result.rows.length === 0) {
        res.status(404).json({ error: 'Job description not found' });
        return;
    }
    res.json({ message: 'Job description deleted' });
});

export default router;
