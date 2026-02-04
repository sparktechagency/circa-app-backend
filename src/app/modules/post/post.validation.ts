import { z } from 'zod';
import { POST_VISIBILITY, WHO_CAN_SEE_STATUS } from '../../../enums/post';

const createPostZodSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }).optional(),
        description: z.string({ required_error: 'Description is required' }),
        image: z.any().optional(),
        is_18_plus: z.string({ required_error: 'is_18_plus is required' }).refine(value => ['true', 'false'].includes(value), { message: 'Invalid is_18_plus' }),
        schedule_post: z.string({ required_error: 'schedule_post is required' }).refine(value => ['true', 'false'].includes(value), { message: 'Invalid schedule_post' }).optional(),
        scdule_date: z.string().refine(value => new Date(value) >= new Date(), { message: 'Schedule date must be in the future' }).optional(),
        schedule_time: z.string().optional(),
        who_can_see: z.nativeEnum(WHO_CAN_SEE_STATUS, { required_error: 'who_can_see is required' }),
        post_visibility: z.array(z.nativeEnum(POST_VISIBILITY)).optional(),
    }),
});


const updatePostZodSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.any().optional(),
        is_18_plus: z.string().optional(),
        schedule_post: z.string().optional(),
        scdule_date: z.string().optional(),
        schedule_time: z.string().optional(),
        who_can_see: z.nativeEnum(WHO_CAN_SEE_STATUS).optional(),
        post_visibility: z.array(z.string()).optional(),
    }),
})


const likePostZodSchema = z.object({
    body: z.object({
        type:z.enum(["post","comment"],{required_error:'type is required'}),
    }),
    params: z.object({
        id: z.string({ required_error: 'Id is required' }).refine(value => /^[0-9a-fA-F]{24}$/.test(value), { message: 'Invalid id' }),
    })
})

const commentPostZodSchema = z.object({
    body: z.object({
        type:z.enum(["post","comment"],{required_error:'type is required'}),
        comment_text:z.string({required_error:'Comment is required'})
    }),
    params: z.object({
        id: z.string({ required_error: 'Id is required' }).refine(value => /^[0-9a-fA-F]{24}$/.test(value), { message: 'Invalid id' }),
    })
})


export const PostValidations = {
    createPostZodSchema,
    updatePostZodSchema,
    likePostZodSchema,
    commentPostZodSchema
};
