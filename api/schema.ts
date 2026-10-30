import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Fonte da verdade das tabelas. Depois de alterar, rode `npm run db:generate`
// para criar a migration correspondente em migrations/.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
