import { z } from 'zod';

const createEventZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        description: z.string({ required_error: 'Description is required' }).optional(),
        image: z.any({ required_error: 'Image is required' }),
        start_date: z.string({ required_error: 'Start date is required' }).optional(),
        end_date: z.string({ required_error: 'End date is required' }).optional(),
        gifts: z.array(z.string()).optional(),
    }),
});

const updateEventZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        image: z.any().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        gifts: z.array(z.string()).optional(),
    }),
});


export const EventValidations = { 
    createEventZodSchema,
    updateEventZodSchema
 };
