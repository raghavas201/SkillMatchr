import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';

const router = Router();

// GET /api/resumes — list current user's resumes
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const result = await query(
        `SELECT r.*, a.ats_score, a.quality_score, a.strength
     FROM resumes r
     LEFT JOIN analyses a ON a.resume_id = r.id
     WHERE r.user_id = $1
     ORDER BY r.uploaded_at DESC`,
        [req.user!.id]
    );
    res.json({ resumes: result.rows });
});

// GET /api/resumes/:id — get single resume with analysis
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const resumeResult = await query(
        'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
        [id, req.user!.id]
    );

    if (resumeResult.rows.length === 0) {
        res.status(404).json({ error: 'Resume not found' });
        return;
    }

    const analysisResult = await query(
        'SELECT * FROM analyses WHERE resume_id = $1 ORDER BY created_at DESC LIMIT 1',
        [id]
    );

    res.json({
        resume: resumeResult.rows[0],
        analysis: analysisResult.rows[0] || null,
    });
});

export default router;
