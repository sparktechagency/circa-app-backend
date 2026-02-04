import { Schema, model } from 'mongoose';
import { CommentModel, IComment, ILike, IPost, LikeModel, PostModel } from './post.interface'; 
import { POST_VISIBILITY, WHO_CAN_SEE_STATUS } from '../../../enums/post';

const postSchema = new Schema<IPost, PostModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: false,
    default: '',
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: false,
    default: [],
  },
  who_can_see: {
    type: String,
    enum: Object.values(WHO_CAN_SEE_STATUS),
    required: true,
    default: WHO_CAN_SEE_STATUS.EVERYONE,
  },
  post_visibility:{
    type: [String],
    enum: Object.values(POST_VISIBILITY),
    required: true,
    default: [POST_VISIBILITY.NONE],
  },
  like_count: {
    type: Number,
    default: 0,
  },
  comment_count: {
    type: Number,
    default: 0,
  },
  is_18_plus: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'delete'],
    default: 'active',
  },
  schedule_post: {
    type: Boolean,
    default: false,
  },
  scdule_date: {
    type: Date,
    default: null,
  },
  schedule_time: {
    type: String,
    default: null,
  },
  
}, { timestamps: true });

postSchema.index({user:1})

export const Post = model<IPost, PostModel>('Post', postSchema);


const likeSchema = new Schema<ILike,LikeModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  for: {
    type: String,
    enum: ['post', 'comment'],
    default: 'post',
  }
}, { timestamps: true });
likeSchema.index({user:1})
likeSchema.index({post:1})
likeSchema.index({comment:1})
export const Like = model<ILike, LikeModel>('Like', likeSchema);


const commentSchema = new Schema<IComment,CommentModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  for: {
    type: String,
    enum: ['post', 'comment'],
    default: 'post',
  },
  comment_text: {
    type: String,
    required: true,
  },
  like_count: {
    type: Number,
    default: 0
  }
}, { timestamps: true });


commentSchema.index({user:1})
commentSchema.index({post:1})
commentSchema.index({comment:1})
export const Comment = model<IComment, CommentModel>('Comment', commentSchema);
