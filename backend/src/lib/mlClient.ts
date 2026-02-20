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
 * The ML service will POST results back to callback_url when done.
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
            timeout: 5_000, // just to kick it off; ML will run async
        });
    } catch (err) {
        // Log but don't throw — the upload succeeded; analysis can be retried
        console.error('[ML] Failed to trigger analysis for resume', resumeId, err);
    }
}
