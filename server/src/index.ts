import app from './app'
import { logger } from './utils/pino.config';

async function main() {
    logger.info("Starting Bun Sever 🥟")
    Bun.serve({
        port: 8000,
        fetch: app.fetch,
        idleTimeout: 60
    });
}

main()
