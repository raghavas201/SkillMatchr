import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// ──────────────────────────────────────────────────────────────
// Determine storage mode
// ──────────────────────────────────────────────────────────────
const useLocal =
    process.env.USE_LOCAL_STORAGE === 'true' || !config.aws.s3Bucket;

let s3Client: S3Client | null = null;
if (!useLocal) {
    s3Client = new S3Client({
        region: config.aws.region,
        credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        },
    });
}

// ──────────────────────────────────────────────────────────────
// Upload a file buffer
// ──────────────────────────────────────────────────────────────
export async function uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string
): Promise<string> {
    if (useLocal) {
        if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
            fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
        }
        const localPath = path.join(LOCAL_UPLOADS_DIR, key.replace(/\//g, '_'));
        fs.writeFileSync(localPath, buffer);
        return `/uploads/${key.replace(/\//g, '_')}`;
    }

    await s3Client!.send(
        new PutObjectCommand({
            Bucket: config.aws.s3Bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        })
    );

    return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
}

// ──────────────────────────────────────────────────────────────
// Delete a file
// ──────────────────────────────────────────────────────────────
export async function deleteFile(key: string): Promise<void> {
    if (useLocal) {
        const localPath = path.join(LOCAL_UPLOADS_DIR, key.replace(/\//g, '_'));
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        return;
    }

    await s3Client!.send(
        new DeleteObjectCommand({ Bucket: config.aws.s3Bucket, Key: key })
    );
}

// ──────────────────────────────────────────────────────────────
// Generate a time-limited presigned download URL
// ──────────────────────────────────────────────────────────────
export async function getPresignedUrl(
    key: string,
    expiresInSeconds = 3600
): Promise<string> {
    if (useLocal) {
        return `/uploads/${key.replace(/\//g, '_')}`;
    }

    const command = new GetObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
    });
    return getSignedUrl(s3Client!, command, { expiresIn: expiresInSeconds });
}
