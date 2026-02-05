import mongoose from 'mongoose';
import { CreditWallet } from '../app/modules/wallet/wallet.model';
import { Transaction } from '../app/modules/transaction/transaction.model';
import { Post } from '../app/modules/post/post.model';
import { User } from '../app/modules/user/user.model';
import {
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../enums/transaction';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';
import { WalletServices } from '../app/modules/wallet/wallet.service';
import { RedisHelper } from '../tools/redis/redis.helper';

export const handlePurhcasePost = async (userId: string, postId: string) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const wallet = await CreditWallet.findOne({ user: userId }).session(
      session,
    );
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }
    const post = await Post.findById(postId).session(session);
    if (!post) {
      throw new Error('Post not found');
    }

    await Promise.all([
      CreditWallet.findOneAndUpdate(
        { user: userId },
        { $inc: { credit: -10 } },
      ).session(session),
      WalletServices.updateBalanceOfCreator(post.user as any, 10, session),
      Transaction.create(
        [
          {
            user: userId,
            total_price: 0,
            payment_received: 0,
            discount_percentage: 0,
            discount_amount: 0,
            platform_fee: 0,
            credit_received: 10,
            status: TRANSACTION_STATUS.SUCCESS,
            type: TRANSACTION_TYPE.CREDIT,
            category: TRANSACTION_CATEGORY.POST,
            creator: post.user,
            post: post._id,
          },
        ],
        { session },
      ),
      Transaction.create(
        [
          {
            user: post.user,
            total_price: 0,
            payment_received: 0,
            discount_percentage: 0,
            discount_amount: 0,
            platform_fee: 0,
            credit_received: 10,
            status: TRANSACTION_STATUS.SUCCESS,
            type: TRANSACTION_TYPE.DEBIT,
            category: TRANSACTION_CATEGORY.POST,
            post: post._id,
          },
        ],
        { session },
      ),
      RedisHelper.keyDelete(`postFeed:${userId}:*`),
      RedisHelper.keyDelete(`postDetails:${user.id}:${post._id}:*`),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `${user.name} see a post for 10 credits`,
          message: `${user.name} see a post for 10 credits`,
          isRead: false,
          filePath: 'post',
          receiver: [post.user],
          referenceId: post._id,
        },
      }),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `You see a post for 10 credits`,
          message: `You see a post for 10 credits`,
          isRead: false,
          filePath: 'post',
          receiver: [userId],
          referenceId: post._id,
        },
      }),
    ]);
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
  }
};
