import { Schema, model } from 'mongoose';
import { ITransaction, TransactionModel } from './transaction.interface'; 
import { getRandomId } from '../../../shared/getRandomId';
import { TRANSACTION_CATEGORY, TRANSACTION_STATUS, TRANSACTION_TYPE } from '../../../enums/transaction';

const transactionSchema = new Schema<ITransaction, TransactionModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'Creator',
  },
  total_price: {
    type: Number,
    default: 0
  },
  payment_received: {
    type: Number,
    required: false,
    default: 0
  },
  credit_received: {
    type: Number,
    required: false,
    default: 0
  },
  discount_percentage: {
    type: Number,
    required: false,
    default: 0
  },
  discount_amount: {
    type: Number,
    required: false,
    default: 0
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  platform_fee: {
    type: Number,
    required: false,
    default: 0
  },
  transaction_id: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    default: TRANSACTION_STATUS.SUCCESS,
  },
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPE),
    required: true,
  },
  category: {
    type: String,
    enum:Object.values(TRANSACTION_CATEGORY),
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  prev_transaction_id: {
    type: String,
    required: false,
  },

}, { timestamps: true });

transactionSchema.index({ user: 1 });
transactionSchema.pre('save', async function (next) {
  this.transaction_id= getRandomId('TRX',5,'number');
  const prev_transaction_id = await Transaction.findOne({ user: this.user }).sort({ createdAt: -1 });
  if (prev_transaction_id) {
    this.prev_transaction_id = prev_transaction_id.transaction_id;
  }
  next();
})
export const Transaction = model<ITransaction, TransactionModel>('Transaction', transactionSchema);
