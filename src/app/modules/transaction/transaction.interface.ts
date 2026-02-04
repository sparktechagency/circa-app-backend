import { JwtPayload } from 'jsonwebtoken';
import { Model, Types } from 'mongoose';
import { TRANSACTION_CATEGORY, TRANSACTION_STATUS, TRANSACTION_TYPE } from '../../../enums/transaction';

export type ITransaction = {
  user:Types.ObjectId,
  creator?:Types.ObjectId,
  total_price: number;
  payment_received: number;
  credit_received?: number;
  discount_percentage: number;
  discount_amount: number;
  platform_fee: number;
  transaction_id?: string;
  order?:Types.ObjectId,
  post?:Types.ObjectId,
  status:TRANSACTION_STATUS,
  type:TRANSACTION_TYPE,
  category:TRANSACTION_CATEGORY,
  prev_transaction_id?:string,
};

export type TransactionModel = Model<ITransaction>;
