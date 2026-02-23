import { Model, Types } from 'mongoose';

export type IWallet = {
  credit: number;
  balance: number;
  user:Types.ObjectId,
  last_transaction_id?:string,
  draft_balance?:number
};

export type WalletModel = Model<IWallet>;


export type ICreditWallet = {
  credit: number;
  user:Types.ObjectId,
  last_transaction_id?:string
}

export type CreditWalletModel = Model<ICreditWallet>;