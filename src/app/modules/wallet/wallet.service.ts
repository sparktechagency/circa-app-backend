import { WalletModel } from './wallet.interface';
import { CreditWallet, Wallet } from './wallet.model';

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
        await Wallet.findOneAndUpdate({ user: userId }, { $inc: { credit } }).session(session);
    } else {
        (await Wallet.create([{ credit, user: userId }]),{session});
    }
};

export const WalletServices = {
    updateCreditOfUser,
    updateBalanceOfCreator
};
