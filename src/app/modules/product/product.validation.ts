import { z } from 'zod';

const createProductZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        price: z.string({ required_error: 'Price is required' }).refine(value => Number(value) > 0, { message: 'Price must be greater than 0' }),
        description: z.string({ required_error: 'Description is required' }),
        image: z.any({ required_error: 'Image is required' }),
        product_style: z.enum(['Physical', 'Digital'], { required_error: 'Product style is required' }).optional().default('Physical'),
        resource_link: z.string().url().optional(),
    }),
});


const updateProductZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        price: z.string().optional(),
        description: z.string().optional(),
        image: z.any().optional(),
        product_style: z.enum(['Physical', 'Digital']).optional(),
        resource_link: z.string().url().optional(),
    }),
});


export const ProductValidations = { 
    createProductZodSchema,
    updateProductZodSchema
};
