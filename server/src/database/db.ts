import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from "@/src/utils/env.parser"

const connectionString = env.DB_URL;
const client = postgres(connectionString, {
    ssl: {
        rejectUnauthorized: false
    }
})
export const db = drizzle(client);
