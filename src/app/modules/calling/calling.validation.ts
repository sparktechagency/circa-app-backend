import { z } from 'zod';

const createCallingZodSchema = z.object({
    body: z.object({
        channelName: z.string({ required_error: 'Channel name is required' }),
        uid: z.number({ required_error: 'Uid is required' }),
        type: z.enum(['audio', 'video'], { required_error: 'Type is required' }),
        chatId: z.string({ required_error: 'Chat id is required' }),
    }),
});

const changeCallingStatusZodSchema = z.object({
    body: z.object({
        channelName: z.string({ required_error: 'Channel name is required' }),
        uid: z.number({ required_error: 'Uid is required' }),
        status: z.enum(['accepted', 'rejected', 'ended', 'cancelled'], { required_error: 'Status is required' }),
    }),
})


export const CallingValidations = { 
    createCallingZodSchema,
    changeCallingStatusZodSchema
};
