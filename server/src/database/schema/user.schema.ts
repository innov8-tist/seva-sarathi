import { text, pgTable, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import {z} from 'zod'

const providers = ['google','local'] as const;
export const pg_provider = pgEnum('provider', providers);


export const userTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  pwd: text('pwd'),
  provider: pg_provider('provider').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  providerid: text('p_id').notNull(),
  email: text('email'),
  pfp: text('pfp'),
});

export type User = typeof userTable.$inferSelect;
export type Providers = (typeof providers)[number];

export const userInsertSchema = createInsertSchema(userTable);
export type UserInsertSchema = z.infer<typeof userInsertSchema>
