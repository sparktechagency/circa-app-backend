import mongoose from 'mongoose';
import { Wallet } from '../app/modules/wallet/wallet.model';
import { Creator } from '../app/modules/user/user.model';
import { Transaction } from '../app/modules/transaction/transaction.model';
import {
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../enums/transaction';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../app/modules/notification/notification.interface';
import { WalletServices } from '../app/modules/wallet/wallet.service';
import stripe from '../config/stripe';

export const handleUserWithdraw = async (userId: string, amount: number) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
   
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    if(wallet.credit < amount * 2){
        throw new Error('Insufficient balance');
    }
     await WalletServices.updateBalanceOfCreator(
      userId,
      -(amount * 2),
      session,
    );
    const user = await Creator.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }
    await Promise.all([
      ,
      Transaction.create(
        [
          {
            total_price: amount,
            payment_received: 0,
            discount_percentage: 0,
            discount_amount: 0,
            platform_fee: 0,
            status: TRANSACTION_STATUS.SUCCESS,
            type: TRANSACTION_TYPE.CREDIT,
            category: TRANSACTION_CATEGORY.WITHDRAW,
            amount: amount,
            creator: userId,
          },
        ],
        { session },
      ),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `You have made a withdraw request!`,
          message: `You have made a withdraw request!`,
          isRead: false,
          filePath: 'user',
          receiver: [userId as any],
          referenceId: user._id,
        } as INotification,
      }),
      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `${user.name} has made a withdraw request!`,
          message: `${user.name} has made a withdraw request!`,
          isRead: false,
          filePath: 'user',
          referenceId: user._id,
        } as INotification,
      }),
      stripe.transfers.create({
        amount: amount * 100,
        currency: 'usd',
        destination: user?.stripe_account_id!,
      }),
    ]);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
  }
};
