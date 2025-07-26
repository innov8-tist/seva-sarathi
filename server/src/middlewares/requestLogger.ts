import { logger } from "@/src/utils/pino.config";
import type { MiddlewareHandler } from "hono";


const requestLogger: MiddlewareHandler = async (c, next) => {
    if (c.req.url.includes('assets') || c.req.url.includes('vite')) {
        return next(); 
    }
    
    logger.info(`Request: ${c.req.method} ${c.req.url}`);
    await next(); 
};

export default requestLogger;