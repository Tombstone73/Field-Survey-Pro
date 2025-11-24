import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export interface AuthRequest extends Request {
    userId?: string;
}

interface JWTPayload {
    userId: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        req.userId = decoded.userId;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
