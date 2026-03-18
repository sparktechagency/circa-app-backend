import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { FLIRTY_FREIENDS_STATUS, USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { ICreator, INotificationSettings, IUser } from './user.interface';
import { Block, Creator, CreatorRequest, NotificationSettings, Report, User } from './user.model';
import { AuthHelper } from '../auth/auth.helper';
import { Response } from 'express';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { Subscription } from '../subscription/subscription.model';
import { Post } from '../post/post.model';
import { Favorite } from '../favorite/favorite.model';
import { Chat } from '../chat/chat.model';
import stripe from '../../../config/stripe';
import AggregateQueryBuilder from '../../builder/AggrigateQueryBuilder';

const createUserToDB = async (payload: Partial<IUser>, res: Response) => {
  payload.role = USER_ROLES.FAN;
  const isExist = await User.findOne({ email: payload.email });
  if (isExist) {
    if (isExist.status === 'delete')
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'You don’t have permission to access this content.It looks like your account has been deactivated.',
      );
    if (!isExist.verified) {
      return await AuthHelper.unverifiedAccountHandle(payload.email!, res);
    }
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
  }
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  //send email
  const otp = generateOTP();
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);


  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate({ _id: createUser._id }, { $set: { authentication } });
  await kafkaProducer.sendMessage('utils', {
    type: 'email',
    data: createAccountTemplate,
  });
  return createUser;
};

const getUserProfileFromDB = async (
  user: JwtPayload,
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(isExistUser.image);
  }

  if(isExistUser.role==USER_ROLES.CREATOR){
      const updateDoc = await Creator.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  }else{
      const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  })
  }


  return payload;
};

const applyForBeACreator = async (user: JwtPayload, body: ICreator) => {
  const { id } = user;
  const isExistUser = await User.findOne({ _id: id });
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (isExistUser.role == USER_ROLES.CREATOR)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You are already a creator!');
  const alreadyApplied = await CreatorRequest.findOne({
    user: id,
    status: { $in: ['Approved', 'Pending'] },
  });
  if (alreadyApplied)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You already applied for creator! Please wait for admin to approve your request.',
    );
  const request = await CreatorRequest.create({
    ...body,
    user: id,
  });

  await kafkaProducer.sendMessage('utils', {
    type: 'notification',
    data: {
      title: `${isExistUser.name} wants to be a creator!`,
      message: `${isExistUser.name} wants to be a creator!`,
      isRead: false,
      filePath: 'application',
      referenceId: request._id,
    } as INotification,
  });
  await RedisHelper.keyDelete('creatorRequests:*');
  return request;
};

const getALlCreatorRequests = async (query: Record<string, any>) => {
  const cache = await RedisHelper.redisGet('creatorRequests', query);
  if (cache) return cache;
  const requestQuery = new QueryBuilder(CreatorRequest.find(), query)
    .paginate()
    .sort()
    .filter();

  const [requests, pagination] = await Promise.all([
    requestQuery.modelQuery
      .populate([
        { path: 'user', select: 'name email image' },
        { path: 'categories', select: 'name' },
      ])
      .exec(),
    requestQuery.getPaginationInfo(),
  ]);

  await RedisHelper.redisSet(
    'creatorRequests',
    { requests, pagination },
    query,
    240,
  );
  return { requests, pagination };
};

const changeStatusOfCreatorRequest = async (
  id: string,
  status: 'Approved' | 'Rejected',
) => {
  const request = await CreatorRequest.findOne({ _id: id });
  if (!request)
    throw new ApiError(StatusCodes.BAD_REQUEST, "Request doesn't exist!");
  if (['Approved', 'Rejected'].includes(request.status))
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Request already ' + request.status,
    );
  if (status == 'Rejected') {
    await CreatorRequest.findOneAndUpdate({ _id: id }, { status: 'Rejected' });

    await kafkaProducer.sendMessage('utils', {
      type: 'notification',
      data: {
        title: `${request.username} rejected your creator request!`,
        message: `${request.username} rejected your creator request!`,
        isRead: false,
        filePath: 'application',
        referenceId: request._id,
        receiver: [request.user],
      } as INotification,
    });
    return await RedisHelper.keyDelete('creatorRequests:*');
  }
  await CreatorRequest.findOneAndUpdate({ _id: id }, { status: 'Approved' });
  await kafkaProducer.sendMessage('circa-user', {
    type: 'approve-request',
    data: id,
  });
  await RedisHelper.keyDelete('creatorRequests:*');
};

const getCreatorList = async (query: Record<string, any>) => {
  const cache = await RedisHelper.redisGet('creators', query);
  if (cache) return cache;
  let initQuery = { role: USER_ROLES.CREATOR, status: 'active' } as Record<
    string,
    any
  >;
  if (query.category) {
    initQuery.categories = { $in: [query.category] };
  }
  const creatorQuery = new QueryBuilder(
    Creator.find(initQuery, { name: 1, image: 1,nickname:1 }),
    query,
  )
    .paginate()
    .sort()
    .filter(['category']);
  let [creators, pagination] = await Promise.all([
    creatorQuery.modelQuery.exec(),
    creatorQuery.getPaginationInfo(),
  ]);
  creators = await Promise.all(
    creators.map(async (creator: any) => {
      const members = await Subscription.countDocuments({
        creator: creator._id,
      })
      return {
        ...creator.toJSON(),
        members,
      };
    })
  )
  await RedisHelper.redisSet('creators', { creators, pagination }, query, 240);
  return { creators, pagination };
};

const getCreatorProfile = async (id: string) => {
  const cache = await RedisHelper.redisGet(`profile:${id}`);
  if (cache) return cache;
  const creator = await Creator.findOne(
    { _id: id },
    { name: 1, image: 1, short_bio: 1 },
  );
  if (!creator)
    throw new ApiError(StatusCodes.BAD_REQUEST, "Creator doesn't exist!");
  const freeMambers = await Subscription.countDocuments({
    creator: id,
    status: 'active',
  });
  const paidMambers = await Subscription.countDocuments({
    creator: id,
    status: 'active',
    price: { $gt: 0 },
  });
  const totalPosts = await Post.countDocuments({ user: id, status: 'active' });
  const data = {
    ...creator.toJSON(),
    freeMambers,
    paidMambers,
    totalPosts,
  };

  await RedisHelper.redisSet(`profile:${id}`, data, {}, 240);
  return data;
};

const getMyCreatorList = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const cache = await RedisHelper.redisGet(`myCreators:${user.id}`, query);
  if (cache) return cache;
  const creatorQuery = new QueryBuilder(
    Subscription.find({ user: user.id }, { creator: 1 }),
    query,
  )
    .paginate()
    .sort()
    .filter();

  let [subscriptions, pagination] = await Promise.all([
    creatorQuery.modelQuery
      .populate('creator', 'name image short_bio date_of_birth age')
      .lean()
      .exec(),
    creatorQuery.getPaginationInfo(),
  ]);
  subscriptions = subscriptions.map(
    (subscription: any) => subscription.creator,
  );

  await RedisHelper.redisSet(
    `myCreators:${user.id}`,
    { subscriptions, pagination },
    query,
    240,
  );
  return { subscriptions, pagination };
};

const getFriendsAndFlattersList = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const cache = await RedisHelper.redisGet(
    `friendsAndFlatters:${user.id}`,
    query,
  );
  if (cache) return cache;

  let initQuery = {
    role: USER_ROLES.CREATOR,
    status: 'active',
    friends_and_flirty_mode: true,
  } as Record<string, any>;
  const status = query?.status || '';

  if (
    status &&
    [FLIRTY_FREIENDS_STATUS.FLIRTY, FLIRTY_FREIENDS_STATUS.PASSONATE].includes(
      status,
    )
  ) {
    initQuery = {
      ...initQuery,
      friends_and_flirty_category: { $in: status.split(',') },
    };
  }

  if (
    query?.gender &&
    [FLIRTY_FREIENDS_STATUS.MALE, FLIRTY_FREIENDS_STATUS.FEMALE].includes(
      query.gender,
    )
  ) {
    initQuery = { ...initQuery, gender: { $in: query.gender.split(',') } };
  }

  if(query?.minAge || query?.maxAge) {
    initQuery = { ...initQuery, age: { $gte: query.minAge, $lte: query.maxAge } };
  }

  const favorites = await Favorite.find(
    { user: user.id },
    { creator: 1 },
  ).distinct('creator');

  initQuery = { ...initQuery, _id: { $nin: favorites } };

  const friendsFlartyQuery = new QueryBuilder(
    Creator.find(initQuery, {
      name: 1,
      image: 1,
      short_bio: 1,
      date_of_birth: 1,
      age: 1,
    }),
    query,
  )
    .paginate()
    .sort();

  let [creators, pagination] = await Promise.all([
    friendsFlartyQuery.modelQuery.exec(),
    friendsFlartyQuery.getPaginationInfo(),
  ]);

  creators = await Promise.all(
    creators.map(async (creator: any) => {
      const members = await Subscription.countDocuments({
        creator: creator._id,
      })
      return {
        ...creator.toJSON(),
        members,
      };
    })
  )

  await RedisHelper.redisSet(
    `friendsAndFlatters:${user.id}`,
    { creators, pagination },
    query,
    240,
  );
  return { creators, pagination };
};

const blockUserIntoDB = async (user: JwtPayload, id: string) => {
 
  
  const block = await Block.findOne({ blocked_by: user.id, user: id }).lean();
  if (block) {
    await Block.findOneAndDelete({ blocked_by: user.id, user: id });
    await Chat.findOneAndUpdate({ participants: { $all: [user.id, id] } }, { status: 'active' });
    return;
  }

  await Block.create({ blocked_by: user.id, user: id });
  await Chat.findOneAndUpdate({ participants: { $all: [user.id, id] } }, { status: 'block' ,blockReason:"blocked by user"});
};

const getBlockList = async (user: JwtPayload, query: Record<string, any>) => {
  const blockQuery = new QueryBuilder(
    Block.find({ blocked_by: user.id }, { user: 1 }),
    query,
  )
    .paginate()
    .sort()
    .filter();

  let [blocks, pagination] = await Promise.all([
    blockQuery.modelQuery
      .populate('user', 'name image short_bio date_of_birth age')
      .lean()
      .exec(),
    blockQuery.getPaginationInfo(),
  ]);

  blocks = blocks.map((block: any) => block.user);

  return { blocks, pagination };
};

const reportUserIntoDB = async (user: JwtPayload, id: string, reason: string) => {
  const k: any = (
    await Report.create({ reported_by: user.id, user: id , reason: reason })
  )

  const report:any = await Report.findById(k._id).populate('reported_by', 'name').populate('user', 'name').lean();
  console.log(report);
  
  await Promise.all([
    kafkaProducer.sendMessage('utils', {
      type: 'notification',
      data: {
        title: `${report.reported_by?.name} reported you!`,
        message: `${report.reported_by?.name} reported you!`,
        isRead: false,
        filePath: 'application',
        referenceId: report._id,
        receiver: [report.user],
      } as INotification,
    }),

    kafkaProducer.sendMessage('utils', {
      type: 'notification',
      data: {
        title: `${report.user?.name} reported on ${report.reported_by?.name}!`,
        message: `${report.user?.name} reported on ${report.reported_by?.name}! please check it out`,
        isRead: false,
        filePath: 'application',
        referenceId: report._id,
      } as INotification,
    }),
  ]);
};


const getReportedUsers = async (user: JwtPayload, query: Record<string, any>) => {
  const reportQuery = new QueryBuilder(
    Report.find(),
    query,
  )
    .paginate()
    .sort()
    .filter();

  let [reports, pagination] = await Promise.all([
    reportQuery.modelQuery
      .populate('user', 'name image email short_bio date_of_birth age')
      .lean()
      .exec(),
    reportQuery.getPaginationInfo(),
  ]);


  return { reports, pagination };
};

const createConnectedAccount = async (user: JwtPayload) => {
  const userDetails = await Creator.findOne({ _id: user.id });
  if (!userDetails) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (userDetails.stripe_login_link) {
    return {
      data: userDetails.stripe_login_link,
    };
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    individual: {
      first_name: userDetails.name,
      email: userDetails.email,
    },
    business_profile: {
      mcc: '7299',
      product_description: 'Freelance services on demand',
      url: 'https://yourplatform.com',
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://yourplatform.com/refresh',
    return_url: 'https://yourplatform.com/return',
    type: 'account_onboarding',
  });

  await Creator.findOneAndUpdate({ _id: user.id }, { stripe_account_id: account.id });
  return {
    data: accountLink.url,
  };
};


const getUserProfileFromUsingDb= async (id: string) => {
  const user = await User.findOne({ _id: id }, { name: 1, image: 1, short_bio: 1, date_of_birth: 1, age: 1,username:1,email:1 ,});
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  return user;
}


const updateNotificationsSettings = async (user: any, payload: INotificationSettings) => {
  const exist = await NotificationSettings.findOne({ user: user.id });
  payload.user = user.id;
  if (exist) {
    await NotificationSettings.findOneAndUpdate({ user: user.id }, payload);
  } else {
    await NotificationSettings.create(payload);
  }
}

const getNotificationsSettings = async (user: any) => {
  const exist = await NotificationSettings.findOne({ user: user.id },{messages:1,calls:1,gift:1,shop:1,_id:0}).lean();
  if (exist) {
    return exist;
  }
  const newSettings = await NotificationSettings.create({ user: user.id });
  return newSettings;
}

const searchCreators = async (query: Record<string, any>, user: JwtPayload) => {
  const myCreators = await Subscription
    .find({ user: user.id })
    .distinct('creator');

  const searchText = query?.searchTerm || '';

  const creatorQuery = new AggregateQueryBuilder(
    Creator,
    query,
  ).paginate().sort();

  creatorQuery.insertCustomStage([
    {
      $lookup: {
        from: 'categories',
        localField: 'categories',
        foreignField: '_id',
        as: 'categories',
        pipeline: [
          {
            $project: { name: 1 }
          }
        ]
      }
    },
 ...(searchText
  ? [{
      $match: {
        $or: [
          { name: { $regex: searchText, $options: 'i' } },
          { categories: { $elemMatch: { name: { $regex: searchText, $options: 'i' } } } },
          // { _id: { $in: myCreators } }
          {username: { $regex: searchText, $options: 'i' }}
        ],
      },
    }]
  : [{
      $match: { _id: { $in: myCreators } }
    }]
),
    {
      $project: {
        name: 1,
        image: 1,
        short_bio: 1,
        date_of_birth: 1,
        age: 1,
        username: 1,
        email: 1,
      },
    }
  ]);

  let [creators, pagination] = await Promise.all([
    creatorQuery.exec(),
    creatorQuery.getPaginationInfo(),
  ]);

  return { creators, pagination };
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  applyForBeACreator,
  getALlCreatorRequests,
  changeStatusOfCreatorRequest,
  getCreatorList,
  getCreatorProfile,
  getMyCreatorList,
  getFriendsAndFlattersList,
  blockUserIntoDB,
  getBlockList,
  reportUserIntoDB,
  getReportedUsers,
  createConnectedAccount,
  getUserProfileFromUsingDb,
  updateNotificationsSettings,
  getNotificationsSettings,
  searchCreators
};
