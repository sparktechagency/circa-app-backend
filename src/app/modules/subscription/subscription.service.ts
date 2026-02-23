import { JwtPayload } from 'jsonwebtoken';
import { SubscriptionModel } from './subscription.interface';
import { Plan } from '../plan/plan.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';
import { Subscription } from './subscription.model';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import QueryBuilder from '../../builder/QueryBuilder';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';
import { Types } from 'mongoose';

const purchasePlanFromStripe = async (user: JwtPayload, planId: string) => {
  const plan = await Plan.findById(planId);

  if (!plan) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Plan not found');
  }

  if (plan.status !== 'active') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Plan is not active');
  }

  const exist = await Subscription.findOne({ user: user.id, plan: planId,status:'active' });
  if (exist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You already have this plan');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `For purchase ${plan.name} plan \n`,
            description: plan.subtitle,
          },
          unit_amount: (plan.price || 0) * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: { userId: user.id, planId: planId },
    success_url: 'https://www.example.com/success',
    cancel_url: 'https://www.example.com/cancel',
  });

  if (!session.url) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Something went wrong!');
  }

  return session.url;
};

const getSubscription = async (user: JwtPayload, creatorId: string) => {
  const cache = await RedisHelper.redisGet(
    `subscription:${user.id}:${creatorId}`,
  );
  if (cache) return cache;
  const result = await Subscription.findOne({
    user: user.id,
    status: 'active',
    creator: creatorId,
  }).lean();
  await RedisHelper.redisSet(
    `subscription:${user.id}:${creatorId}`,
    result,
    {},
    240,
  );
  return result;
};

const getMySubscriptionCreators = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const cache = await RedisHelper.redisGet(`creatorList:${user.id}`, query);
  if (cache) return cache;
  const subscrionsQuery = new QueryBuilder(
    Subscription.find({ user: user.id, status: 'active' }),
    query,
  )
    .paginate()
    .sort()
    .filter();

  let [subscriptions, pagination] = await Promise.all([
    subscrionsQuery.modelQuery
      .populate('creator', 'name email image short_bio date_of_birth age')
      .lean()
      .exec(),
    subscrionsQuery.getPaginationInfo(),
  ]);
  subscriptions = subscriptions.map(
    (subscription: any) => subscription.creator,
  );
  await RedisHelper.redisSet(
    `creatorList:${user.id}`,
    { subscriptions, pagination },
    query,
    240,
  );
  return { subscriptions, pagination };
};

const joinCreatorForFree = async (user: JwtPayload, creatorId: Types.ObjectId) => {
    const exist = await Subscription.findOne({ user: user.id, creator: creatorId, status: 'active' ,price:0});
    if (exist) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You already have this plan');
    }
  const freePlan = await Plan.findOne({ fromAdmin: true });
  if (!freePlan) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Free plan not found');
  }
  await Subscription.create({
    user: user.id,
    creator: creatorId,
    plan: freePlan._id,
    start_date: new Date(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
    status: 'active',
  });
  await Promise.all([
    kafkaProducer.sendMessage('utils', {
    type: 'notification',
    data: {
      title: 'You have joined a creator for free!',
      message: 'You have joined a creator for free!',
      isRead: false,
      filePath: 'application',
      referenceId: creatorId,
      receiver: [user.id],
    } as INotification,
  }),kafkaProducer.sendMessage('utils', {
    type: 'notification',
    data: {
      title: `${user.name} has joined your creator for free!`,
      message: `${user.name} has joined your creator for free!`,
      isRead: false,
      filePath: 'application',
      referenceId: creatorId,
      receiver: [creatorId],
    } as INotification,
  }),
 RedisHelper.keyDelete(`creatorList:${user.id}:*`),
  ])
};

export const SubscriptionServices = {
  purchasePlanFromStripe,
  getSubscription,
  getMySubscriptionCreators,
  joinCreatorForFree
};
