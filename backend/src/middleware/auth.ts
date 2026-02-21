import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        // Augment Express Request so req.user is typed as JwtPayload
        interface User extends JwtPayload { }
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;
    const token =
        // Support both cookie and Bearer header
        req.cookies?.token ||
        (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (!token) {
        res.status(401).json({ error: 'Unauthorized – no token provided' });
        return;
    }

    try {
        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized – invalid or expired token' });
    }
}

export function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;
    const token =
        req.cookies?.token ||
        (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (token) {
        try {
            req.user = jwt.verify(token, config.jwt.secret) as JwtPayload;
        } catch {
            // ignore — optional
        }
    }
    next();
}
