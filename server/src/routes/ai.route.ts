import { Hono } from "hono";
import { google } from "@ai-sdk/google";
import { streamText as honoStreamText } from "hono/streaming";
import { zValidator } from '@hono/zod-validator'

import { streamText } from "ai";
import { aiStreamReqZodSchema } from "../zodSchemas/ai";

const aiRoutes = new Hono()
    .post('/stream', zValidator('form', aiStreamReqZodSchema), async (c) => {
        try {
            const validated = c.req.valid('form')

            const result = await streamText({
                model: google("gemini-2.0-flash"),
                prompt: validated.body
            });
            let reader = result.textStream.getReader();

            return honoStreamText(c, async (stream) => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    await stream.write(value)
                }
            });
        } catch (err) {
            console.log("Error:", err);
            return c.json({ error: "Failed to generate ideas" }, 500);
        }
    })



export default aiRoutes;