import { Model, Types } from 'mongoose';
import { POST_VISIBILITY, WHO_CAN_SEE_STATUS } from '../../../enums/post';

export type IPost = {
  user:Types.ObjectId,
  title:string,
  description:string,
  images?:string[],
  video?:string,
  who_can_see:WHO_CAN_SEE_STATUS,
  post_visibility:POST_VISIBILITY[],
  like_count:number,
  comment_count:number,
  is_18_plus:boolean,
  status:"active" | "delete" | "draft",
  schedule_post:boolean,
  scdule_date?:Date,
  schedule_time?:string,
};

export type PostModel = Model<IPost>;


export type ILike = {
  user:Types.ObjectId,
  post?:Types.ObjectId,
  comment?:Types.ObjectId
  for ? : "post" | "comment"
}

export type LikeModel = Model<ILike>;

export type IComment = {
  user:Types.ObjectId,
  post?:Types.ObjectId,
  comment?:Types.ObjectId
  for ? : "post" | "comment"
  comment_text:string,
  like_count:number
}

export type CommentModel = Model<IComment>;
