import { Hono } from "hono";
import { google } from "@ai-sdk/google";
import { streamText as honoStreamText } from "hono/streaming";
import { zValidator } from '@hono/zod-validator'
import { sarvam } from 'sarvam-ai-sdk';
import { experimental_transcribe as transcribe } from "ai";
import { readFile } from "fs/promises";
import { join } from "path";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

import { streamText } from "ai";
import { aiStreamReqZodSchema } from "../zodSchemas/ai";

const aiRoutes = new Hono()
    .post('/stream', zValidator('json', aiStreamReqZodSchema), async (c) => {
        try {
            const validated = c.req.valid('json')

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
    .post('/audio-transcribe', async (c) => {
        try {
            const formData = await c.req.formData();
            const audioFile = formData.get('audio') as File;
            
            if (!audioFile) {
                return c.json({ error: "No audio file provided" }, 400);
            }

            // Convert File to Buffer
            const arrayBuffer = await audioFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Save to temporary file
            const tempFilePath = join(tmpdir(), `${randomUUID()}.wav`);
            await writeFile(tempFilePath, buffer);

            const result = await transcribe({
                model: sarvam.speechTranslation("saaras:v2"),
                audio: await readFile(tempFilePath),
            });

            // Clean up temporary file
            try {
                await readFile(tempFilePath); // Check if file exists
                await writeFile(tempFilePath, ''); // Clear file
            } catch (e) {
                // File might already be deleted, ignore
            }

            return c.json({ text: result.text });
        } catch (err) {
            console.log("Error transcribing audio:", err);
            return c.json({ error: "Failed to transcribe audio" }, 500);
        }
    })
    .post('/audio-transalate',async(c)=>{
        const result = await transcribe({
            model: sarvam.speechTranslation("saaras:v2"),
            audio: await readFile(join(process.cwd(), "jayaram.wav")),
        });
        return c.text(result.text)
    })


export default aiRoutes;