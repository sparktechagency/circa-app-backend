import { z } from 'zod';

const withdrawMoneyZodSchema = z.object({
    body: z.object({
        amount: z.number({ required_error: 'Amount is required' }),
    }),
});

export const WalletValidations = {
    withdrawMoneyZodSchema
};
