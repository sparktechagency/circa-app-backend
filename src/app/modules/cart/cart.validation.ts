import { z } from 'zod';

const addProductIntoCartZodSchema = z.object({
    body: z.object({
        product: z.string({ required_error: 'Product id is required' }),
        quantity: z.number({ required_error: 'Quantity is required' }),
    }),
});


const increaseOrDecreaseQuantityZodSchema = z.object({
    body: z.object({
        amount: z.number({ required_error: 'Amount is required' }),
    }),
    params: z.object({
        id: z.string({ required_error: 'Id is required' }).refine(value => /^[0-9a-fA-F]{24}$/.test(value), { message: 'Invalid id' }),
    })
});

export const CartValidations = {
    addProductIntoCartZodSchema,
    increaseOrDecreaseQuantityZodSchema
};
