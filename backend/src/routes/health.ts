import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    let dbStatus = 'error';
    try {
        await pool.query('SELECT 1');
        dbStatus = 'ok';
    } catch {
        // db not available
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            api: 'ok',
            database: dbStatus,
        },
    });
});

export default router;
