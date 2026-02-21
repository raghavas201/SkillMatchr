import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { requireAuth } from '../middleware/auth';
import { query } from '../db';

const router = Router();

// ──────────────────────────────────────────────────────────────
// GET /auth/google  — Redirect user to Google consent screen
// ──────────────────────────────────────────────────────────────
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    })
);

// ──────────────────────────────────────────────────────────────
// GET /auth/google/callback  — Google redirects back here
// ──────────────────────────────────────────────────────────────
router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${config.frontendUrl}/?error=oauth_failed`,
    }),
    (req: Request, res: Response) => {
        const user = req.user as {
            id: string;
            email: string;
            role: string;
        };

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
        );

        // Also set cookie as fallback (same-origin deployments)
        res.cookie('token', token, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Pass token in URL so the frontend can pick it up cross-origin
        res.redirect(`${config.frontendUrl}/dashboard?token=${token}`);
    }
);

// ──────────────────────────────────────────────────────────────
// GET /auth/me  — Return current authenticated user
// ──────────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    const result = await query(
        'SELECT id, email, name, avatar_url, role, created_at FROM users WHERE id = $1',
        [req.user!.id]
    );

    if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    res.json({ user: result.rows[0] });
});

// ──────────────────────────────────────────────────────────────
// POST /auth/logout  — Clear the JWT cookie
// ──────────────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

export default router;
