import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import {
  BlockModel,
  CreatorModel,
  CreatorRequestModel,
  IBlock,
  ICreator,
  ICreatorRequest,
  INotificationSettings,
  IReport,
  IUser,
  NotificationSettingsModel,
  ReportModel,
  UserModal,
} from './user.interface';

const userSchema = new Schema<IUser, UserModal>(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
      minlength: 8,
    },
    contact: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '/asset/default.jpg',
    },
    status: {
      type: String,
      enum: ['active', 'delete'],
      default: 'active',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: 0,
    },
    gender: {
      type: String,
    },
    date_of_birth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    fcm_tokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, discriminatorKey: 'role' },
);

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre('save', async function (next) {
  //check user
  const isExist = await User.findOne({ email: this.email });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
  }

  //password hash
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  );
  next();
});

export const User = model<IUser, UserModal>('User', userSchema);
export const Fan = User.discriminator(
  'FAN',
  new Schema({}, { timestamps: true }),
);
export const Admin = User.discriminator(
  'ADMIN',
  new Schema({}, { timestamps: true }),
);
export const SuperAdmin = User.discriminator(
  'SUPER_ADMIN',
  new Schema({}, { timestamps: true }),
);

// Creator Schema
const creatorSchema = new Schema<IUser & ICreator, UserModal>(
  {
    username: {
      type: String,
      required: false,
      default: '',
    },
    date_of_birth: {
      type: Date,
      required: false,
      default: null,
    },
    short_bio: {
      type: String,
      required: false,
      default: '',
    },
    age: {
      type: Number,
      required: false,
      default: 0,
    },
    document: {
      type: String,
      required: false,
      default: '',
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
    },
    friends_and_flirty_mode: {
      type: Boolean,
      required: false,
    },
    friends_and_flirty_category: {
      type: String,
      required: false,
    },
    stripe_account_id: {
      type: String,
      required: false,
      default: '',
    },
    stripe_login_link: {
      type: String,
      required: false,
      default: '',
    },
    amazon_wishlist_link: {
      type: String,
      required: false,
      default: '',
    },
    nickname: {
      type: String,
      required: false,
      default: '',
    }
  },
  { timestamps: true },
);
creatorSchema.index({ categories: 1 });

export const Creator = User.discriminator('CREATOR', creatorSchema);

const creatorRequestSchema = new Schema<ICreatorRequest, CreatorRequestModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
    },
    date_of_birth: {
      type: Date,
      required: false,
      default: null,
    },
    document: {
      type: String,
      required: false,
      default: '',
    },
    friends_and_flirty_category: {
      type: String,
      required: false,
    },
    friends_and_flirty_mode: {
      type: Boolean,
      required: false,
      default: false,
    },
    short_bio: {
      type: String,
      required: false,
      default: '',
    },
    username: {
      type: String,
      required: false,
      default: '',
    },
  },
  { timestamps: true },
);

export const CreatorRequest = model<ICreatorRequest, CreatorRequestModel>(
  'CreatorRequest',
  creatorRequestSchema,
);

const blockSchema = new Schema<IBlock, BlockModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    blocked_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);
blockSchema.index({ user: 1 });
blockSchema.index({ blocked_by: 1, user: 1 }, { unique: true });
export const Block = model<IBlock, BlockModel>('Block', blockSchema);

const reportSchema = new Schema<IReport, ReportModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reported_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true },
);
reportSchema.index({ user: 1 });
export const Report = model<IReport, ReportModel>('Report', reportSchema);



const notificationSettingsSchema = new Schema<INotificationSettings, NotificationSettingsModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  messages: {
    type: Boolean,
    default: true
  },
  calls: {
    type: Boolean,
    default: true
  },
  shop: {
    type: Boolean,
    default: true
  },
  gift: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

notificationSettingsSchema.index({ user: 1 });

export const NotificationSettings = model<INotificationSettings, NotificationSettingsModel>('NotificationSettings', notificationSettingsSchema);
