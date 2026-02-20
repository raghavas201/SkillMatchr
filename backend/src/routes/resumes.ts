import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/s3';
import { triggerAnalysis } from '../lib/mlClient';

const router = Router();

// ──────────────────────────────────────────────────────────────
// Multer — temp disk storage before S3 upload
// ──────────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    },
});

// ──────────────────────────────────────────────────────────────
// GET /api/resumes — list current user's resumes
// ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response) => {
    const { status, sort } = req.query as Record<string, string>;

    let orderBy = 'r.uploaded_at DESC';
    if (sort === 'ats') orderBy = 'a.ats_score DESC NULLS LAST';
    if (sort === 'quality') orderBy = 'a.quality_score DESC NULLS LAST';

    const statusFilter = status && status !== 'all' ? `AND r.status = '${status}'` : '';

    const result = await query(
        `SELECT r.id, r.original_name, r.file_type, r.file_size, r.status,
            r.uploaded_at, r.s3_key,
            a.ats_score, a.quality_score, a.strength, a.extracted_skills
     FROM resumes r
     LEFT JOIN analyses a ON a.resume_id = r.id
     WHERE r.user_id = $1 ${statusFilter}
     ORDER BY ${orderBy}`,
        [req.user!.id]
    );
    res.json({ resumes: result.rows });
});

// ──────────────────────────────────────────────────────────────
// GET /api/resumes/:id — single resume + full analysis
// ──────────────────────────────────────────────────────────────
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

    const resume = resumeResult.rows[0] as { s3_key: string; status: string };

    const analysisResult = await query(
        'SELECT * FROM analyses WHERE resume_id = $1 ORDER BY created_at DESC LIMIT 1',
        [id]
    );

    // Generate presigned URL for download
    let downloadUrl: string | null = null;
    if (resume.s3_key) {
        downloadUrl = await getPresignedUrl(resume.s3_key);
    }

    res.json({
        resume: { ...resumeResult.rows[0], download_url: downloadUrl },
        analysis: analysisResult.rows[0] || null,
    });
});

// ──────────────────────────────────────────────────────────────
// POST /api/resumes/upload — upload + persist + trigger ML
// ──────────────────────────────────────────────────────────────
router.post(
    '/upload',
    requireAuth,
    upload.single('resume'),
    async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: 'No file provided' });
            return;
        }

        const { originalname, mimetype, buffer, size } = req.file;
        const ext = path.extname(originalname).toLowerCase().replace('.', '');
        const fileType = ext === 'pdf' ? 'pdf' : 'docx';
        const resumeId = uuidv4();
        const s3Key = `resumes/${req.user!.id}/${resumeId}.${ext}`;

        // 1. Upload to S3 (or local)
        await uploadFile(buffer, s3Key, mimetype);

        // 2. Insert resume row in DB (status=pending)
        await query(
            `INSERT INTO resumes (id, user_id, original_name, s3_key, file_type, file_size, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
            [resumeId, req.user!.id, originalname, s3Key, fileType, size]
        );

        // 3. Kick off ML analysis (non-blocking)
        void triggerAnalysis(resumeId, s3Key, fileType);

        res.status(201).json({
            message: 'Resume uploaded successfully. Analysis is in progress.',
            resume: {
                id: resumeId,
                original_name: originalname,
                file_type: fileType,
                status: 'pending',
            },
        });
    }
);

// ──────────────────────────────────────────────────────────────
// POST /api/resumes/:id/analysis — ML callback
// ──────────────────────────────────────────────────────────────
router.post('/:id/analysis', async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        ats_score,
        quality_score,
        strength,
        extracted_skills,
        grammar_issues,
        keyword_matches,
        raw_result,
        error,
    } = req.body as {
        ats_score?: number;
        quality_score?: number;
        strength?: string;
        extracted_skills?: string[];
        grammar_issues?: object[];
        keyword_matches?: object;
        raw_result?: object;
        error?: string;
    };

    if (error) {
        await query(
            `UPDATE resumes SET status = 'error', error_message = $1 WHERE id = $2`,
            [error, id]
        );
        res.json({ ok: true });
        return;
    }

    // Write analysis result
    await query(
        `INSERT INTO analyses
       (resume_id, ats_score, quality_score, strength, extracted_skills, grammar_issues, keyword_matches, raw_result)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            id,
            ats_score,
            quality_score,
            strength,
            JSON.stringify(extracted_skills ?? []),
            JSON.stringify(grammar_issues ?? []),
            JSON.stringify(keyword_matches ?? {}),
            JSON.stringify(raw_result ?? {}),
        ]
    );

    // Update resume status to done
    await query(`UPDATE resumes SET status = 'done' WHERE id = $1`, [id]);

    res.json({ ok: true });
});

// ──────────────────────────────────────────────────────────────
// DELETE /api/resumes/:id
// ──────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await query(
        'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
        [id, req.user!.id]
    );
    if (result.rows.length === 0) {
        res.status(404).json({ error: 'Resume not found' });
        return;
    }

    const resume = result.rows[0] as { s3_key: string };
    if (resume.s3_key) {
        await deleteFile(resume.s3_key);
    }
    await query('DELETE FROM resumes WHERE id = $1', [id]);
    res.json({ message: 'Resume deleted' });
});

export default router;
