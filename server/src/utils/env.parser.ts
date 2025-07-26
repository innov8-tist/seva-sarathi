import {z} from 'zod'
import { config } from 'dotenv'

const nodeEnv = process.env.NODE_ENV || 'development'
console.log(`Current NODE_ENV: ${nodeEnv}`)

const envFile = nodeEnv === 'production' ? './server/.env' : './server/.env.local'
config({path:envFile})

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    DB_URL:z.string({message:"DB_URL is missing in env"}),
    SERVER_URL:z.string({message:"SERVER_URL is missing in env"}),
    CLIENT_URL:z.string(),
    SUPABASE_SERVICE_ROLE:z.string(),
    SUPABASE_URL:z.string(),
    SUPABASE_ANON_KEY:z.string({message:"SUPABASE_ANON_KEY is missing in env"}),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string()
})

declare global{
    namespace NodeJS{
        interface ProcessEnv extends z.infer<typeof envSchema>{}
    }
}

export const env = envSchema.parse({
    ...process.env,
    NODE_ENV: nodeEnv, 
})
