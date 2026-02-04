import { z } from 'zod';

const createPackageZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        icon: z.string({ required_error: 'Icon is required' }),
        credit: z.number({ required_error: 'Credit is required' }),
        discount: z.number().optional(),
        price: z.number().optional(),
    }),
});


const updatePackageZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        icon: z.string().optional(),
        credit: z.number().optional(),
        discount: z.number().optional(),
        price: z.number().optional(),
    }),
});

export const PackageValidations = {
    createPackageZodSchema,
    updatePackageZodSchema
 };
