import { z } from 'zod';

const createGiftZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        image:z.any(),
        credit:z.string({required_error:'Credit is required'}),
    }),
});

const updateGiftZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        image:z.any().optional(),
        credit:z.string().optional(),
    }),
});

const sendGiftZodSchema = z.object({
    body: z.object({
        gift:z.string({required_error:'Gift is required'}).refine(value => /^[0-9a-fA-F]{24}$/.test(value), { message: 'Invalid gift ID' }),
        receivers:z.array(z.string()).refine(value => value.length > 0, { message: 'At least one receiver is required' }).refine(value=> /^[0-9a-fA-F]{24}$/.test(value[0]), { message: 'Invalid receiver ID' }),
        event:z.string().refine(value => /^[0-9a-fA-F]{24}$/.test(value), { message: 'Invalid event ID' }).optional(),
    }),
})


export const GiftValidations = { 
    createGiftZodSchema,
    updateGiftZodSchema,
    sendGiftZodSchema
};
