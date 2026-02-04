import { z } from 'zod';
import { FEATURES_LIST_STATUS } from '../../../enums/features';

const createPlanZodSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        subtitle: z.string({ required_error: 'Subtitle is required' }),
        price: z.number({ required_error: 'Price is required' }),
        features: z.array(z.object({
            name: z.nativeEnum(FEATURES_LIST_STATUS, { required_error: 'Feature name is required' }),
            status: z.boolean({ required_error: 'Feature status is required' }).optional().default(true),
            discount: z.number().optional().default(0),
        })),
        category:z.enum(['Free','Monthly','Yearly'],{required_error:'Category is required'}),
        duration:z.number({required_error:'Duration is required'}),
        emoji:z.string({required_error:'Emoji is required'})
    }),
});


const updatePlanZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        subtitle: z.string().optional(),
        price: z.number().optional(),
        features: z.array(z.object({
            name: z.nativeEnum(FEATURES_LIST_STATUS).optional(),
            status: z.boolean().optional(),
            discount: z.number().optional(),
        })).optional(),
        category:z.enum(['Free','Monthly','Yearly']).optional(),
        duration:z.number().optional(),
        emoji:z.string().optional()
    }),
});




export const PlanValidations = {
    createPlanZodSchema,
    updatePlanZodSchema
};
