import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import authRoute from './routes/auth.route'
import requestLogger from './middlewares/requestLogger'
import { logger } from './utils/pino.config'
import { HTTPException } from 'hono/http-exception'
import { cors } from 'hono/cors'
import { env } from './utils/env.parser'
import path from 'path'
import aiRoute from './routes/ai.route'
import { promises as fs } from "fs";

const app = new Hono()
app.use('*', cors({
    origin: env.CLIENT_URL,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['Set-Cookie', 'Content-Length', 'X-Kuma-Revision']
}))
app.use('*', requestLogger)

const apiRoutes = app.basePath("/api/")
    .route('/auth/', authRoute)
    .route('/ai/', aiRoute)

let rootpath = path.join(__dirname, '../public')
let indexpath = path.join(__dirname, '../public/index.html')

app.use('*', serveStatic({ root: rootpath }))
app.get('*', async (c) => {
    if (c.req.path.startsWith('/api/')) {
        return c.notFound()
    }
    const cnt = await fs.readFile(indexpath)
    const html = cnt.toString('utf-8')
    return c.html(html)
})



app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ message: err.message }, err.status);
    }
    logger.error(err.message)
    return c.json({ message: "Internal Server Error" }, 500);
})

export default app
export type ApiRoutesType = typeof apiRoutes
