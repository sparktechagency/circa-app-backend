import { Types } from "mongoose";
import z from "zod";

const createMessageZodSchema = z.object({
  body: z.object({
    chatId: z.string(),
    text: z.string().optional(),
    image: z.any().optional(),
    doc: z.array(z.any()).optional(),
    type: z.enum(['text', 'image', 'document','zoom-link']),
  }),
});

export const MessageValidation = {
  createMessageZodSchema,
};