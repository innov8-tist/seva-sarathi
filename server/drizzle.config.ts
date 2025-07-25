import { env } from './src/utils/env.parser';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/database/schema/*.ts',
    out: './supabase/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: env.DB_URL,
    },
});

