import mongoose from "mongoose";
import Stripe from "stripe";
import { Package } from "../app/modules/package/package.model";
import ApiError from "../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { User } from "../app/modules/user/user.model";
import { WalletServices } from "../app/modules/wallet/wallet.service";
import { Transaction } from "../app/modules/transaction/transaction.model";
import { TRANSACTION_CATEGORY, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../enums/transaction";
import { kafkaProducer } from "../tools/kafka/kafka-producers/kafka.producer";
import { INotification } from "../app/modules/notification/notification.interface";

export const handleCreditPurchase =async (checkoutSession:Stripe.Checkout.Session) => {
    const mongooseSession  = await mongoose.startSession()

    try {
        await mongooseSession.startTransaction();
        const {packageId,userId} = checkoutSession?.metadata as any
        const packageItem = await Package.findById(packageId).session(mongooseSession)
        if(!packageItem){
            throw new ApiError(StatusCodes.NOT_FOUND, "Package doesn't exist!");
        }

        const user = await User.findById(userId).session(mongooseSession)
        if(!user){
            throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
        }

        await WalletServices.updateCreditOfUser(userId,packageItem.credit,mongooseSession)

        const transaction = (await Transaction.create([{
            user:userId,
            total_price:packageItem.price,
            payment_received:0,
            discount_percentage:0,
            credit_received:packageItem.credit,
            discount_amount:0,
            platform_fee:packageItem.price,
            status:TRANSACTION_STATUS.SUCCESS,
            type:TRANSACTION_TYPE.CREDIT,
            category:TRANSACTION_CATEGORY.DIPOSIT
        }],{session:mongooseSession}))[0]
    
        await kafkaProducer.sendMessage('utils', {
            type: 'notification',
            data: {
                title: `You have successfully purchased ${packageItem.name}!`,
                message: `You have successfully purchased ${packageItem.name}!`,
                isRead: false,
                filePath: 'user',
                referenceId: user._id,
                receiver: [user._id],
            } as INotification,
        });

        await kafkaProducer.sendMessage('utils', {
            type: 'notification',
            data: {
                title: `${(user as any).name} has successfully purchased ${packageItem.name}!`,
                message: `${(user as any).name} has successfully purchased ${packageItem.name}!`,
                isRead: false,
                filePath: 'user',
                referenceId: user._id,
            } as INotification,
        });

        await mongooseSession.commitTransaction();
        mongooseSession.endSession();
        
    } catch (error) {
        await mongooseSession.abortTransaction();
        mongooseSession.endSession();
        console.log(error);
    }
};