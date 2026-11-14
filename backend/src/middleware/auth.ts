import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../models/database';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    isAdmin: boolean;
    plexToken?: string;
    serverUrl?: string;
  };
  authSession?: {
    id: string;
    token: string;
  };
}

// Download tickets: short-lived keys put in download URLs instead of the session token.
// Browsers keep download URLs in their history, so a leaked ticket must expire fast.
// shortcut: in-memory, so tickets are lost on restart and not shared between processes (one container).
export const TICKET_TTL_MS = 2 * 60 * 1000;
const tickets = new Map<string, { sessionToken: string; expires: number }>();

export const issueDownloadTicket = (sessionToken: string, now = Date.now()): string => {
  for (const [key, t] of tickets) if (t.expires <= now) tickets.delete(key);
  const ticket = crypto.randomBytes(24).toString('hex');
  tickets.set(ticket, { sessionToken, expires: now + TICKET_TTL_MS });
  return ticket;
};

const resolveTicket = (ticket: unknown, now = Date.now()): string | null => {
  if (typeof ticket !== 'string') return null;
  const t = tickets.get(ticket);
  return t && t.expires > now ? t.sessionToken : null;
};

// allowTicket: also accept ?ticket=... so the browser can download files natively
// (plain <a href> links can't send an Authorization header).
export const createAuthMiddleware = (db: DatabaseService, options: { allowTicket?: boolean } = {}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : options.allowTicket
          ? resolveTicket(req.query.ticket)
          : null;

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const session = db.getSessionByToken(token);
      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Try admin user first
      const adminUser = db.getAdminUserById(session.userId);
      if (adminUser) {
        req.user = {
          id: adminUser.id,
          username: adminUser.username,
          isAdmin: adminUser.isAdmin,
        };
        req.authSession = {
          id: session.id,
          token: session.token,
        };
        return next();
      }

      // Try plex user
      const plexUser = db.getPlexUserById(session.userId);
      if (plexUser) {
        req.user = {
          id: plexUser.id,
          username: plexUser.username,
          isAdmin: plexUser.isAdmin,
          plexToken: plexUser.plexToken,
          serverUrl: plexUser.serverUrl,
        };
        req.authSession = {
          id: session.id,
          token: session.token,
        };
        return next();
      }

      return res.status(401).json({ error: 'User not found' });
    } catch (error) {
      logger.error('Authentication error', { error });
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
};

export const createAdminMiddleware = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  };
};
