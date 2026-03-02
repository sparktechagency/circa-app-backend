import { JwtPayload } from 'jsonwebtoken';
import { WalletModel } from './wallet.interface';
import { CreditWallet, Wallet } from './wallet.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Creator } from '../user/user.model';
import kafka from '../../../config/kafka';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { USER_ROLES } from '../../../enums/user';
import { DashboardServices } from '../dashboard/dashboard.service';

const updateCreditOfUser = async (userId: string, credit: number,session?:any) => {
    const exist = await CreditWallet.findOne({ user: userId }).session(session);
    if (exist) {
        await CreditWallet.findOneAndUpdate({ user: userId }, { $inc: { credit } },{session});
    } else {
        await CreditWallet.create([{ credit, user: userId }],{session});
    }
};

const updateBalanceOfCreator = async (userId: string, credit: number,session?:any) => {
    const exist = await Wallet.findOne({ user: userId }).session(session);
    if (exist) {
        const balance = credit * 0.5
        await Wallet.findOneAndUpdate({ user: userId }, { $inc: { credit,balance }}).session(session);
    } else {
        const balance = credit * 0.5
        await Wallet.create([{ credit, user: userId,balance }]),{session}
    }
};


const addDraftBalance = async (userId: string, credit: number,session?:any) => {
    const exist = await Wallet.findOne({ user: userId }).session(session);
    if (exist) {
        await Wallet.findOneAndUpdate({ user: userId }, { $inc: { draft_balance: credit } },{session});
    } else {
        await Wallet.create([{ draft_balance: credit, user: userId }],{session});
    }
};

const withdrawMoney = async (user:JwtPayload,amount:number) =>{
    const credit = amount * 2
    const wallet = await Wallet.findOne({ user: user.id }).lean();
    if(wallet!.credit < credit){
        throw new ApiError(StatusCodes.BAD_REQUEST,'Insufficient balance');
    }
    const creator = await Creator.findOne({ _id: user.id }).lean();
    if(!creator?.stripe_login_link){
        throw new ApiError(StatusCodes.BAD_REQUEST,'Creator is not connected to stripe');
    }

    if(wallet!.balance < amount){
        throw new ApiError(StatusCodes.BAD_REQUEST,'Insufficient balance');
    }

    await kafkaProducer.sendMessage("circa-user",{
        type:"withdraw",
        data:{user:user.id,amount}
    })
    return true

}


const getWallet = async (user: JwtPayload) => {
    if(user.role == USER_ROLES.FAN){
        return await CreditWallet.findOne({ user: user.id }, { credit: 1 }).lean();
    }
    const data = (await Wallet.findOne({ user: user.id }, { credit: 1, balance: 1 }).lean())||{credit:0,balance:0};
    return {
        ...data,
        analatys:await DashboardServices.getCreatorAnalaticsSummary(user.id)
    }
};

export const WalletServices = {
    updateCreditOfUser,
    updateBalanceOfCreator,
    addDraftBalance,
    withdrawMoney,
    getWallet
};
