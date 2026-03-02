import { z } from 'zod';
import { FLIRTY_FREIENDS_STATUS } from '../../../enums/user';

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z.string({ required_error: 'Email is required' }),
    password: z.string({ required_error: 'Password is required' }),
    contact: z.string({ required_error: 'Contact is required' }),
    profile: z.string().optional(),
  }),
});

const updateUserZodSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
});

const applyForBeACreatorZodSchema = z.object({
  body: z.object({
    username: z.string({ required_error: 'Username is required' }),
    date_of_birth: z.string({ required_error: 'Date of birth is required' }).refine(value => new Date(value) <= new Date(), { message: 'Date of birth must be in the past' }).refine(value => new Date(value).getFullYear() - 18 <= new Date().getFullYear(), { message: 'You must be at least 18 years old' }),
    short_bio: z.string({ required_error: 'Short bio is required' }),
    doc: z.any({ required_error: 'Document is required' }),
    friends_and_flirty_mode: z.string({ required_error: 'Friends and flirty mode is required' }).refine(value => ['true', 'false'].includes(value), { message: 'Invalid friends and flirty mode' }).optional().default('false'),
    friends_and_flirty_category: z.enum(['Friends', 'Flirty', 'Passonate'], { required_error: 'Friends and flirty category is required' }).optional(),
    //all heve to objectID
    categories: z.array(z.string()).refine(value => value.length > 0, { message: 'At least one category is required' }).refine(value=> /^[0-9a-fA-F]{24}$/.test(value[0]), { message: 'Invalid category ID' }),
  }),
})

const changeStatusOfCreatorRequestZodSchema = z.object({
  body: z.object({
    status: z.enum(['Approved', 'Rejected'], { required_error: 'Status is required' }),
  }),
})


const getFriendsAndFlattersListZodSchema = z.object({
  query: z.object({
    status:z.nativeEnum(FLIRTY_FREIENDS_STATUS,{required_error:'Status is required'}).optional()
  })
})


const reportUserZodSchema = z.object({
  body: z.object({
    reason: z.string({ required_error: 'Reason is required' }),
    user: z.string({ required_error: 'User is required' }).refine(value => /^[0-9a-fA-F]{24}$/.test(value), { message: 'Invalid user ID' }),
  }),
})

const blockUserZodSchema = z.object({
  body: z.object({
    user: z.string({ required_error: 'User is required' }).refine(value => /^[0-9a-fA-F]{24}$/.test(value), { message: 'Invalid user ID' }),
  }),
})


const updateNotificationsSettingsZodSchema = z.object({
  body: z.object({
    messages: z.boolean({ required_error: 'Messages is required' }),
    calls: z.boolean({ required_error: 'Calls is required' }),
    shop: z.boolean({ required_error: 'Shop is required' }),
    gift: z.boolean({ required_error: 'Gift is required' }),
  }),
})

const searchCreatorsZodSchema = z.object({
  query: z.object({
    searchTerm: z.string({ required_error: 'Search term is required' }).optional(),
  }),
})

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  applyForBeACreatorZodSchema,
  changeStatusOfCreatorRequestZodSchema,
  getFriendsAndFlattersListZodSchema,
  reportUserZodSchema,
  blockUserZodSchema,
  updateNotificationsSettingsZodSchema,
  searchCreatorsZodSchema
};
