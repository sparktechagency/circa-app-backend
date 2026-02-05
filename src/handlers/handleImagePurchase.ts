import mongoose from 'mongoose';
import { Message } from '../app/modules/message/message.model';
import { Transaction } from '../app/modules/transaction/transaction.model';
import { TRANSACTION_CATEGORY, TRANSACTION_TYPE } from '../enums/transaction';
import { CreditWallet } from '../app/modules/wallet/wallet.model';
import { RedisHelper } from '../tools/redis/redis.helper';
import { WalletServices } from '../app/modules/wallet/wallet.service';

export const handleImagePurhcase = async (userId: string, messageId: string) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const message = await Message.findById(messageId)
      .select('+acctualImage')
      .session(session);
    if (!message) {
      throw new Error('Message not found');
    }

    

    await Promise.all([
      Message.findByIdAndUpdate(
        messageId,
        { image: message.acctualImage, acctualImage: undefined },
        { session },
      ),
      RedisHelper.keyDelete(`messages:${message?.chatId}:*`),
      CreditWallet.findOneAndUpdate(
        { user: userId },
        { $inc: { credit: -10 } },
      ).session(session),
      WalletServices.updateBalanceOfCreator(message.sender as any, 10,session),
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
            type: TRANSACTION_TYPE.CREDIT,
            category: TRANSACTION_CATEGORY.CHAT,
            creator: message.sender,
          },
        ],
        { session },
      ),
      Transaction.create(
        [
          {
            user: message.sender,
            total_price: 0,
            payment_received: 0,
            discount_percentage: 0,
            discount_amount: 0,
            platform_fee: 0,
            credit_received: 10,
            type: TRANSACTION_TYPE.DEBIT,
            category: TRANSACTION_CATEGORY.CHAT,
            creator: message.sender,
          },
        ],
        { session },
      ),
    ]);
    const io = global.socketServer;
    if (io) {
      io.emit(`getMessage::${message?.chatId}`, {});
    }
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
  }
};
