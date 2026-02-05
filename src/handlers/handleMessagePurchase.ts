import mongoose from "mongoose";
import { IMessageSession } from "../app/modules/message/message.interface";
import { MessageSession } from "../app/modules/message/message.model";
import { User } from "../app/modules/user/user.model";
import { CreditWallet } from "../app/modules/wallet/wallet.model";
import { Transaction } from "../app/modules/transaction/transaction.model";
import { TRANSACTION_CATEGORY, TRANSACTION_TYPE } from "../enums/transaction";
import { kafkaProducer } from "../tools/kafka/kafka-producers/kafka.producer";
import { INotification } from "../app/modules/notification/notification.interface";
import { WalletServices } from "../app/modules/wallet/wallet.service";

export const handleMessagePurchase = async (messageSession:IMessageSession) => {
    const session = await mongoose.startSession();

    try {
       await session.startTransaction();

        const { chatId, fan, creator, messageCount } = messageSession;
        const exist = await MessageSession.findOne({ chatId }).session(session);

        if (exist) {
            await MessageSession.findOneAndUpdate({ chatId }, { $inc: { messageCount } }).session(session);
        } else {
            await MessageSession.create([{ chatId, fan, creator, messageCount }],{session});
        }

        const user = await User.findById(fan).session(session);
        if (!user) {
            throw new Error('User not found');
        }
       
        await Promise.all([
            CreditWallet.findOneAndUpdate({ user: fan }, { $inc: { credit: -5 } }).session(session),
            WalletServices.updateBalanceOfCreator(creator as any,5,session),
            Transaction.create([{
                user: fan,
                total_price:0,
                payment_received:0,
                discount_percentage:0,
                discount_amount:0,
                platform_fee:0,
                credit_received:5,
                type:TRANSACTION_TYPE.CREDIT,
                category:TRANSACTION_CATEGORY.CHAT
            }],{session}),
            Transaction.create([{
                user: creator,
                total_price:0,
                payment_received:0,
                discount_percentage:0,
                discount_amount:0,
                platform_fee:0,
                credit_received:5,
                type:TRANSACTION_TYPE.DEBIT,
                category:TRANSACTION_CATEGORY.CHAT
            }]),
            kafkaProducer.sendMessage("utils", {
                type: "notification",
                data: {
                    title: `${user.name} buy 20 messages! for you!`,
                    message: `${user.name} buy 20 messages! for you!`,
                    isRead: false,
                    filePath: "message",
                    referenceId: chatId,
                    receiver: [creator],
                } as INotification,
            }),
            kafkaProducer.sendMessage("utils", {
                type: "notification",
                data: {
                    title: `You buy 20 messages!!`,
                    message: `You buy 20 messages!!`,
                    isRead: false,
                    filePath: "message",
                    referenceId: chatId,
                    receiver: [fan],
                } as INotification,
            }),
        ])
        await session.commitTransaction();
        session.endSession();
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
    }
};