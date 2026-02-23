import mongoose from "mongoose";
import { IGift, ISendGiftPayload } from "../app/modules/gift/gift.interface";
import { Gift, GiftSend } from "../app/modules/gift/gift.model";
import ApiError from "../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { IUser } from "../app/modules/user/user.interface";
import { ChatService } from "../app/modules/chat/chat.service";
import { CreditWallet } from "../app/modules/wallet/wallet.model";
import { WalletServices } from "../app/modules/wallet/wallet.service";
import { kafkaProducer } from "../tools/kafka/kafka-producers/kafka.producer";
import { INotification } from "../app/modules/notification/notification.interface";
import { Transaction } from "../app/modules/transaction/transaction.model";
import { TRANSACTION_CATEGORY, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../enums/transaction";
import { User } from "../app/modules/user/user.model";
import { Message } from "../app/modules/message/message.model";
import { MessageService } from "../app/modules/message/message.service";

export const handleSendGift = async (giftDetails:ISendGiftPayload,sender:string ) => {
    const session = await mongoose.startSession();
    try {
        await session.startTransaction();
        const gift = await Gift.findById(giftDetails.gift);
        if(!gift){
            throw new ApiError(StatusCodes.NOT_FOUND, 'Gift not found');
        }

        const user = await User.findById(sender);
        if(!user){
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
        }

    await WalletServices.updateCreditOfUser(sender,-gift.credit,session);

        await Promise.all(giftDetails.receivers.map(async (receiver) => {
            return await sendGiftToCreators(user as any,gift as any,receiver as any,session);
        }));

        await kafkaProducer.sendMessage("utils",{
            type:"notification",
            data:{
                title:`Your gifts have been sent!`,
                message:`Your gifts have been sent!`,
                isRead:false,
                filePath:"gift",
                receiver:[sender as any],
                referenceId:gift._id as any
            } as INotification
        })

        await session.commitTransaction();
        await session.endSession();
    
    } catch (error) {
        console.log(error);
        
    }
};


const sendGiftToCreators = async (user:IUser & {_id:string},gift:IGift&{_id:string},receiver:string,session?:any) => {
    try {
        const chat:any = await ChatService.createChatToDB([user._id,receiver],{id:user._id,email:user.email,role:user.role} as any);
        await Promise.all([
            
            GiftSend.create([{
                gift:gift._id,
                sender:user._id,
                receiver:receiver,
                chatId:chat._id
            }],{session}),
            MessageService.sendMessageToDB({chatId:chat._id,sender:user._id as any,gift:gift._id as any}),
            CreditWallet.findOneAndUpdate({user:user._id},{$inc:{credit:-gift.credit}},{session}),
            WalletServices.updateBalanceOfCreator(receiver,gift.credit,session),
            kafkaProducer.sendMessage("utils",{
                type:"notification",
                data:{
                    title:`${user.name} sent you a gift!`,
                    message:`${user.name} sent you a gift!`,
                    isRead:false,
                    filePath:"gift",
                    receiver:[receiver as any],
                    referenceId:gift._id as any
                } as INotification
            }),
            Transaction.create([{
                total_price:0,
                payment_received:0,
                discount_percentage:0,
                discount_amount:0,
                platform_fee:0,
                user:user._id,
                credit_received:gift.credit,
                status:TRANSACTION_STATUS.SUCCESS,
                type:TRANSACTION_TYPE.DEBIT,
                category:TRANSACTION_CATEGORY.GIFT,
                creator:receiver,
            }])
        ])
   

    } catch (error) {
        console.log(error);
        
    }
};