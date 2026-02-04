import { Schema, model } from 'mongoose';
import { CreditWalletModel, ICreditWallet, IWallet, WalletModel } from './wallet.interface'; 

const walletSchema = new Schema<IWallet, WalletModel>({
  credit: {
    type: Number,
    required: false,
    default: 0
  },
  balance: {
    type: Number,
    required: false,
    default: 0
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  last_transaction_id: {
    type: String,
  }
}, { timestamps: true });

walletSchema.index({ user: 1 }, { unique: true });
export const Wallet = model<IWallet, WalletModel>('Wallet', walletSchema);

const creditWalletSchema = new Schema<ICreditWallet, CreditWalletModel>({
  credit: {
    type: Number,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  last_transaction_id: {
    type: String,
  }
}, { timestamps: true });
creditWalletSchema.index({ user: 1 }, { unique: true });
export const CreditWallet = model<ICreditWallet, CreditWalletModel>('CreditWallet', creditWalletSchema);
