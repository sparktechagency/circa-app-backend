import { z } from 'zod';

const createCategoryZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        image:z.any(),
    }),
});

const updateCategoryZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        image:z.any()
    }),
});


export const CategoryValidations = {
    createCategoryZodSchema,
    updateCategoryZodSchema
};
