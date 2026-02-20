import axios from 'axios';
import { config } from '../config';

interface TriggerPayload {
    resume_id: string;
    s3_key: string;
    file_type: string;
    callback_url: string;
}

/**
 * Fire-and-forget: tells the ML service to analyze a resume.
 */
export async function triggerAnalysis(
    resumeId: string,
    s3Key: string,
    fileType: string
): Promise<void> {
    const callbackUrl = `${process.env.BACKEND_INTERNAL_URL || 'http://backend:4000'
        }/api/resumes/${resumeId}/analysis`;

    const payload: TriggerPayload = {
        resume_id: resumeId,
        s3_key: s3Key,
        file_type: fileType,
        callback_url: callbackUrl,
    };

    try {
        await axios.post(`${config.mlServiceUrl}/analyze`, payload, {
            timeout: 5_000,
        });
    } catch (err) {
        console.error('[ML] Failed to trigger analysis for resume', resumeId, err);
    }
}

// ──────────────────────────────────────────────────────────────
// Phase 3: JD match trigger
// ──────────────────────────────────────────────────────────────

interface ResumeForMatch {
    id: string;
    original_name: string;
    extracted_skills: string[] | string;
    ats_score: number;
    quality_score: number;
    raw_result: Record<string, unknown>;
}

/**
 * Fire-and-forget: asks the ML service to rank resumes against a JD.
 */
export async function triggerMatch(
    jobId: string,
    jdText: string,
    resumes: ResumeForMatch[]
): Promise<void> {
    const callbackUrl = `${process.env.BACKEND_INTERNAL_URL || 'http://backend:4000'
        }/api/jobs/${jobId}/match-result`;

    const payload = {
        job_id: jobId,
        jd_text: jdText,
        callback_url: callbackUrl,
        resumes: resumes.map((r) => ({
            id: r.id,
            name: r.original_name,
            skills: typeof r.extracted_skills === 'string'
                ? JSON.parse(r.extracted_skills)
                : r.extracted_skills ?? [],
            ats_score: r.ats_score ?? 0,
            quality_score: r.quality_score ?? 0,
            // Full text if available in raw_result
            text: (r.raw_result as Record<string, unknown>)?.text ?? '',
        })),
    };

    try {
        await axios.post(`${config.mlServiceUrl}/match`, payload, {
            timeout: 5_000,
        });
    } catch (err) {
        console.error('[ML] Failed to trigger match for job', jobId, err);
    }
}
