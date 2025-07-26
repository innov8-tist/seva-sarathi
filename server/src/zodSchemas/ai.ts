import z from "zod";

export const aiStreamReqZodSchema = z.object({
    body: z.string(),
})