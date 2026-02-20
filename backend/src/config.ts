import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env variable: ${key}`);
    return value;
}

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.BACKEND_PORT || '4000', 10),

    db: {
        connectionString:
            process.env.DATABASE_URL ||
            `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
    },

    jwt: {
        secret: requireEnv('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    google: {
        clientId: requireEnv('GOOGLE_CLIENT_ID'),
        clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
        callbackUrl:
            process.env.GOOGLE_CALLBACK_URL ||
            'http://localhost:4000/auth/google/callback',
    },

    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_S3_BUCKET || '',
    },
};
