import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({
    connectionString: config.db.connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
});

pool.on('error', (err) => {
    console.error('[DB] Unexpected client error', err);
});

export async function query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
) {
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.debug(`[DB] query "${text.slice(0, 60)}…" took ${duration}ms`);
    return result;
}
