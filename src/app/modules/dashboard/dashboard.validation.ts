import { z } from 'zod';
import { TRANSACTION_CATEGORY } from '../../../enums/transaction';

const getCreatorAnalaticsZodSchema = z.object({
    query: z.object({
        type:z.enum(["week","month","year"],{required_error:'type is required'}).optional(),
        category:z.nativeEnum(TRANSACTION_CATEGORY,{required_error:'category is required'}).optional()
    }),
});


export const DashboardValidations = { 
    getCreatorAnalaticsZodSchema
 };
