import { Model, Types } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export type IUser = {
  name: string;
  role: USER_ROLES;
  username?: string;
  contact: string;
  email: string;
  password: string;
  image?: string;
  status: 'active' | 'delete';
  verified: boolean;
  gender ?: string;
  date_of_birth ?: Date;
  age ?: number;
  fcm_tokens ?: string[];
  document ?: string;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;

export type ICreator = {
  categories: Types.ObjectId[];
  friends_and_flirty_mode: boolean;
  friends_and_flirty_category:"Friends" | "Flirty" | "Passonate",
  username: string;
  date_of_birth: Date,
  short_bio: string,
  document: string,
  age: number,
  stripe_login_link?: string,
  stripe_account_id?: string,
  amazon_wishlist_link?: string,
  nickname ?: string
}

export type CreatorModel = Model<ICreator>;


export type ICreatorRequest = ICreator &{
  user:Types.ObjectId,
  status:"Pending" | "Approved" | "Rejected"
}

export type CreatorRequestModel = Model<ICreatorRequest>;


export type IBlock = {
  user: Types.ObjectId;
  blocked_by: Types.ObjectId;
  status: 'active' | 'delete';
};

export type BlockModel = Model<IBlock>;

export type IReport = {
  user: Types.ObjectId;
  reported_by: Types.ObjectId;
  reason: string;
  status: 'active' | 'delete';
};


export type INotificationSettings = {
  user: Types.ObjectId;
  messages: boolean;
  calls: boolean;
  shop: boolean;
  gift:boolean
}

export type NotificationSettingsModel = Model<INotificationSettings>;


export type ReportModel = Model<IReport>;



