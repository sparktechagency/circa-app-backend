import mongoose from 'mongoose';
import Stripe from 'stripe';
import stripe from '../config/stripe';
import { Plan } from '../app/modules/plan/plan.model';
import { User } from '../app/modules/user/user.model';
import { Subscription } from '../app/modules/subscription/subscription.model';
import { Transaction } from '../app/modules/transaction/transaction.model';
import {
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../enums/transaction';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../app/modules/notification/notification.interface';
import { RedisHelper } from '../tools/redis/redis.helper';

export const handleSubscriptionPurchase = async (
  subSession: Stripe.Checkout.Session,
) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();

    const { userId, planId } = subSession?.metadata as any;

    const plan = await Plan.findById(planId).populate('user').session(session);
    const user = await User.findById(userId).session(session);

    if (!plan || !user) {
      throw new Error('Plan or user not found');
    }

    const subscription = (
      await Subscription.create(
        [
          {
            user: user._id,
            plan: plan._id,
            payment_intent_id: subSession?.payment_intent,
          },
        ],
        { session },
      )
    )[0];

    await Promise.all([
      Transaction.create(
        [
          {
            user: user._id,
            total_price: plan.price,
            payment_received: 0,
            discount_percentage: 0,
            discount_amount: 0,
            platform_fee: plan.price * 0.1,
            status: TRANSACTION_STATUS.SUCCESS,
            type: TRANSACTION_TYPE.CREDIT,
            category: TRANSACTION_CATEGORY.MEMBERSHIP,
            creator: plan.user._id,
          },
        ],
        { session },
      ),

      Transaction.create(
        [
          {
            user: plan.user._id,
            total_price: plan.price,
            payment_received: plan.price - plan.price * 0.1,
            discount_percentage: 0,
            discount_amount: 0,
            platform_fee: plan.price * 0.1,
            status: TRANSACTION_STATUS.SUCCESS,
            type: TRANSACTION_TYPE.DEBIT,
            category: TRANSACTION_CATEGORY.MEMBERSHIP,
            subscription: subscription._id,
          },
        ],
        { session },
      ),
      RedisHelper.keyDelete(`profile:${plan.user._id}:*`),
      RedisHelper.keyDelete(`myCreators:${user._id}:*`),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `You have subscribed to ${plan.name} plan!`,
          message: `You have subscribed to ${plan.name} plan!`,
          isRead: false,
          filePath: 'plan',
          receiver: [user._id],
          referenceId: subscription._id,
        } as INotification,
      }),

      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `${user.name} has subscribed to ${plan.name} plan!`,
          message: `${user.name} has subscribed to ${plan.name} plan!`,
          isRead: false,
          filePath: 'plan',
          receiver: [plan.user._id],
          referenceId: subscription._id,
        } as INotification,
      }),
    ]);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    try {
      await stripe.refunds.create({
        payment_intent: subSession?.payment_intent as string,
      });
    } catch (error) {}
  }
};
