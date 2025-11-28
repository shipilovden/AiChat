import crypto from 'node:crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { logger, type DatabaseAdapter } from '@elizaos/core';
import { eq, and, lt } from 'drizzle-orm';
import { telegramSessionTable } from '@elizaos/plugin-sql';
import type { SessionUser } from '../types/telegram';

/**
 * Session configuration
 */
const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Database adapter for session storage
 * If not set, falls back to in-memory storage
 */
let databaseAdapter: DatabaseAdapter | null = null;

/**
 * Initialize session storage with database adapter
 * If database is provided, sessions will be stored in database
 * Otherwise, falls back to in-memory storage
 */
export function initializeSessionStorage(database: DatabaseAdapter): void {
  databaseAdapter = database;
  logger.info('[Session] Initialized session storage with database');

  // Start cleanup interval for database sessions
  setInterval(async () => {
    if (databaseAdapter) {
      try {
        const db = (databaseAdapter as any).db;
        if (db) {
          const expiredThreshold = new Date(Date.now() - SESSION_TIMEOUT_MS);
          const result = await db
            .delete(telegramSessionTable)
            .where(lt(telegramSessionTable.lastActivity, expiredThreshold));
          
          logger.debug(`[Session] Cleaned up expired sessions from database`);
        }
      } catch (error) {
        logger.error('[Session] Error cleaning up expired sessions:', error);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Gets the database instance from adapter
 */
function getDatabase(): any {
  if (!databaseAdapter) {
    return null;
  }
  return (databaseAdapter as any).db;
}

/**
 * Converts database row to SessionUser
 */
function rowToSessionUser(row: any): SessionUser {
  return {
    telegramId: Number.parseInt(row.telegramId, 10),
    firstName: row.firstName || undefined,
    lastName: row.lastName || undefined,
    username: row.username || undefined,
    photoUrl: row.photoUrl || undefined,
    sessionId: row.sessionId,
    createdAt: new Date(row.createdAt),
    lastActivity: new Date(row.lastActivity),
    authToken: row.authToken || undefined,
  };
}

/**
 * Creates a new user session
 */
export async function createSession(
  user: Omit<SessionUser, 'sessionId' | 'createdAt' | 'lastActivity'> & { authToken?: string }
): Promise<string> {
  const sessionId = generateSessionId();
  const now = new Date();

  const db = getDatabase();
  
  if (db) {
    // Store in database
    try {
      await db.insert(telegramSessionTable).values({
        sessionId,
        telegramId: String(user.telegramId),
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        username: user.username || null,
        photoUrl: user.photoUrl || null,
        authToken: user.authToken || null,
        createdAt: now,
        lastActivity: now,
      });

      logger.debug(`[Session] Created session ${sessionId} for user ${user.telegramId}${user.authToken ? ` with auth token` : ''} in database`);
      return sessionId;
    } catch (error) {
      logger.error('[Session] Error creating session in database:', error);
      // Fall through to in-memory storage
    }
  }

  // Fallback to in-memory storage (for development or if database not available)
  const session: SessionUser = {
    ...user,
    sessionId,
    createdAt: now,
    lastActivity: now,
    authToken: user.authToken,
  };

  // In-memory storage (temporary, will be removed when database is fully integrated)
  if (!(global as any).__telegramSessions) {
    (global as any).__telegramSessions = new Map<string, SessionUser>();
  }
  (global as any).__telegramSessions.set(sessionId, session);
  logger.debug(`[Session] Created session ${sessionId} for user ${user.telegramId} in memory (fallback)`);

  return sessionId;
}

/**
 * Gets user from session
 */
export async function getSessionUser(sessionId: string): Promise<SessionUser | null> {
  const db = getDatabase();

  if (db) {
    try {
      const result = await db
        .select()
        .from(telegramSessionTable)
        .where(eq(telegramSessionTable.sessionId, sessionId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      const now = Date.now();
      const lastActivity = new Date(row.lastActivity).getTime();
      const sessionAge = now - lastActivity;

      // Check if session expired
      if (sessionAge > SESSION_TIMEOUT_MS) {
        await deleteSession(sessionId);
        return null;
      }

      // Update last activity
      await db
        .update(telegramSessionTable)
        .set({ lastActivity: new Date() })
        .where(eq(telegramSessionTable.sessionId, sessionId));

      return rowToSessionUser(row);
    } catch (error) {
      logger.error('[Session] Error getting session from database:', error);
      // Fall through to in-memory storage
    }
  }

  // Fallback to in-memory storage
  if ((global as any).__telegramSessions) {
    const session = (global as any).__telegramSessions.get(sessionId);
    if (session) {
      const now = Date.now();
      const sessionAge = now - session.lastActivity.getTime();

      if (sessionAge > SESSION_TIMEOUT_MS) {
        (global as any).__telegramSessions.delete(sessionId);
        return null;
      }

      session.lastActivity = new Date();
      return session;
    }
  }

  return null;
}

/**
 * Deletes a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const db = getDatabase();

  if (db) {
    try {
      const result = await db
        .delete(telegramSessionTable)
        .where(eq(telegramSessionTable.sessionId, sessionId));

      logger.debug(`[Session] Deleted session ${sessionId} from database`);
      return true;
    } catch (error) {
      logger.error('[Session] Error deleting session from database:', error);
      // Fall through to in-memory storage
    }
  }

  // Fallback to in-memory storage
  if ((global as any).__telegramSessions) {
    const deleted = (global as any).__telegramSessions.delete(sessionId);
    if (deleted) {
      logger.debug(`[Session] Deleted session ${sessionId} from memory`);
    }
    return deleted;
  }

  return false;
}

/**
 * Gets user session by Telegram ID
 * Useful for bot commands to find user by their Telegram ID
 */
export async function getSessionByTelegramId(telegramId: number): Promise<SessionUser | null> {
  const db = getDatabase();

  if (db) {
    try {
      const result = await db
        .select()
        .from(telegramSessionTable)
        .where(eq(telegramSessionTable.telegramId, String(telegramId)))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      const now = Date.now();
      const lastActivity = new Date(row.lastActivity).getTime();
      const sessionAge = now - lastActivity;

      // Check if session expired
      if (sessionAge > SESSION_TIMEOUT_MS) {
        await deleteSession(row.sessionId);
        return null;
      }

      // Update last activity
      await db
        .update(telegramSessionTable)
        .set({ lastActivity: new Date() })
        .where(eq(telegramSessionTable.sessionId, row.sessionId));

      return rowToSessionUser(row);
    } catch (error) {
      logger.error('[Session] Error getting session by Telegram ID from database:', error);
      // Fall through to in-memory storage
    }
  }

  // Fallback to in-memory storage
  if ((global as any).__telegramSessions) {
    for (const session of (global as any).__telegramSessions.values()) {
      if (session.telegramId === telegramId) {
        const now = Date.now();
        const sessionAge = now - session.lastActivity.getTime();

        if (sessionAge > SESSION_TIMEOUT_MS) {
          (global as any).__telegramSessions.delete(session.sessionId);
          return null;
        }

        session.lastActivity = new Date();
        return session;
      }
    }
  }

  return null;
}

/**
 * Gets session by auth token
 */
export async function getSessionByAuthToken(authToken: string): Promise<SessionUser | null> {
  const db = getDatabase();

  if (db) {
    try {
      const result = await db
        .select()
        .from(telegramSessionTable)
        .where(eq(telegramSessionTable.authToken, authToken))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      const now = Date.now();
      const lastActivity = new Date(row.lastActivity).getTime();
      const sessionAge = now - lastActivity;

      // Check if session expired
      if (sessionAge > SESSION_TIMEOUT_MS) {
        await deleteSession(row.sessionId);
        return null;
      }

      // Update last activity
      await db
        .update(telegramSessionTable)
        .set({ lastActivity: new Date() })
        .where(eq(telegramSessionTable.sessionId, row.sessionId));

      return rowToSessionUser(row);
    } catch (error) {
      logger.error('[Session] Error getting session by auth token from database:', error);
      // Fall through to in-memory storage
    }
  }

  // Fallback to in-memory storage
  if ((global as any).__telegramSessions) {
    for (const session of (global as any).__telegramSessions.values()) {
      if (session.authToken === authToken) {
        const now = Date.now();
        const sessionAge = now - session.lastActivity.getTime();

        if (sessionAge > SESSION_TIMEOUT_MS) {
          (global as any).__telegramSessions.delete(session.sessionId);
          return null;
        }

        session.lastActivity = new Date();
        return session;
      }
    }
  }

  return null;
}

/**
 * Generates a secure random session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Express middleware to extract and validate session
 * Adds req.sessionUser if valid session found
 */
export async function sessionMiddleware(
  req: Request & { sessionUser?: SessionUser },
  res: Response,
  next: NextFunction
): Promise<void> {
  // Get session ID from cookie or Authorization header
  const sessionId =
    req.cookies?.sessionId ||
    req.headers.authorization?.replace('Bearer ', '') ||
    req.headers['x-session-id'] as string;

  if (sessionId) {
    const user = await getSessionUser(sessionId);
    if (user) {
      req.sessionUser = user;
    }
  }

  next();
}
