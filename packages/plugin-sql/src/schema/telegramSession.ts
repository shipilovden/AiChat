import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

/**
 * Table for storing Telegram authentication sessions
 * Used for web authentication via Telegram bot
 */
export const telegramSessionTable = pgTable(
  'telegram_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: text('session_id').notNull().unique(),
    telegramId: text('telegram_id').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    username: text('username'),
    photoUrl: text('photo_url'),
    authToken: text('auth_token'), // Optional auth token for bot authentication flow
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    lastActivity: timestamp('last_activity', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => {
    return {
      telegramIdIdx: index('telegram_sessions_telegram_id_idx').on(table.telegramId),
      sessionIdIdx: index('telegram_sessions_session_id_idx').on(table.sessionId),
      authTokenIdx: index('telegram_sessions_auth_token_idx').on(table.authToken),
    };
  }
);

