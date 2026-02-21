import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';

const router = Router();

/**
 * GET /api/analytics/summary
 * Returns a per-user analytics summary:
 *   - Score history (ats + quality over time)
 *   - Average ATS and quality scores
 *   - Top extracted skills
 *   - Top predicted roles
 *   - JD match history
 */
router.get('/summary', requireAuth, async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // ── Score history ───────────────────────────────────────────
    const historyResult = await query(
        `SELECT
            DATE(a.created_at) AS date,
            ROUND(AVG(a.ats_score)::numeric, 1)     AS avg_ats,
            ROUND(AVG(a.quality_score)::numeric, 1)  AS avg_quality,
            COUNT(*)::int                             AS count
         FROM analyses a
         JOIN resumes r ON r.id = a.resume_id
         WHERE r.user_id = $1
         GROUP BY DATE(a.created_at)
         ORDER BY DATE(a.created_at) ASC
         LIMIT 30`,
        [userId]
    );

    // ── Overall averages ────────────────────────────────────────
    const avgResult = await query(
        `SELECT
            ROUND(AVG(a.ats_score)::numeric, 1)    AS avg_ats,
            ROUND(AVG(a.quality_score)::numeric, 1) AS avg_quality,
            COUNT(*)::int                            AS total_analyzed
         FROM analyses a
         JOIN resumes r ON r.id = a.resume_id
         WHERE r.user_id = $1`,
        [userId]
    );

    // ── Skills frequency ────────────────────────────────────────
    const skillsResult = await query(
        `SELECT a.extracted_skills
         FROM analyses a
         JOIN resumes r ON r.id = a.resume_id
         WHERE r.user_id = $1 AND a.extracted_skills IS NOT NULL`,
        [userId]
    );

    const skillCount: Record<string, number> = {};
    for (const row of skillsResult.rows) {
        const rawSkills: unknown = row.extracted_skills;
        const skills: string[] = Array.isArray(rawSkills)
            ? rawSkills as string[]
            : JSON.parse(typeof rawSkills === 'string' ? rawSkills : '[]');
        for (const s of skills) {
            const key = s.toLowerCase();
            skillCount[key] = (skillCount[key] ?? 0) + 1;
        }
    }
    const topSkills = Object.entries(skillCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12)
        .map(([skill, count]) => ({ skill, count }));

    // ── Role predictions frequency ──────────────────────────────
    const rolesResult = await query(
        `SELECT a.role_prediction
         FROM analyses a
         JOIN resumes r ON r.id = a.resume_id
         WHERE r.user_id = $1 AND a.role_prediction IS NOT NULL`,
        [userId]
    );

    const roleCount: Record<string, number> = {};
    for (const row of rolesResult.rows) {
        let rp = row.role_prediction as Record<string, unknown> | string | unknown;
        if (typeof rp === 'string') {
            try { rp = JSON.parse(rp) as Record<string, unknown>; } catch { continue; }
        }
        const roleName = (rp as Record<string, unknown>)?.role;
        if (roleName && typeof roleName === 'string') {
            roleCount[roleName] = (roleCount[roleName] ?? 0) + 1;
        }
    }
    const topRoles = Object.entries(roleCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([role, count]) => ({ role, count }));

    // ── JD match history ────────────────────────────────────────
    const matchHistoryResult = await query(
        `SELECT
            jd.title,
            jd.company,
            COUNT(jm.id)::int AS candidate_count,
            ROUND(AVG(jm.similarity_score)::numeric, 3) AS avg_similarity,
            ROUND(AVG(jm.hiring_probability)::numeric, 3) AS avg_hire_prob,
            jd.created_at
         FROM job_descriptions jd
         LEFT JOIN jd_matches jm ON jm.jd_id = jd.id
         WHERE jd.user_id = $1
         GROUP BY jd.id
         ORDER BY jd.created_at DESC
         LIMIT 10`,
        [userId]
    );

    res.json({
        score_history: historyResult.rows,
        averages: avgResult.rows[0] ?? { avg_ats: 0, avg_quality: 0, total_analyzed: 0 },
        top_skills: topSkills,
        top_roles: topRoles,
        jd_match_history: matchHistoryResult.rows,
    });
});

export default router;
