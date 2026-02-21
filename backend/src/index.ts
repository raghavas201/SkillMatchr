import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from './passport';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Routes
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import resumesRouter from './routes/resumes';
import jobsRouter from './routes/jobs';
import analyticsRouter from './routes/analytics';

const app = express();

// ──────────────────────────────────────────────────────────────
// Security & utility middleware
// ──────────────────────────────────────────────────────────────
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);
app.use(
    cors({
        origin: config.frontendUrl,
        credentials: true,
    })
);
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ──────────────────────────────────────────────────────────────
// Passport (no session — we use JWT)
// ──────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ──────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/auth', authRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/analytics', analyticsRouter);

// 404
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use(errorHandler);

// ──────────────────────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────────────────────
app.listen(config.port, '0.0.0.0', () => {
    console.log(
        `[Server] Running in ${config.env} mode on port ${config.port}`
    );
});

export default app;
