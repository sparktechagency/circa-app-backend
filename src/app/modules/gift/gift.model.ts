import { Schema, model } from 'mongoose';
import { IGift, GiftModel, IGiftSend, GiftSendModel } from './gift.interface'; 

const giftSchema = new Schema<IGift, GiftModel>({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  credit: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'delete'],
    default: 'active',
  }
}, { timestamps: true });

export const Gift = model<IGift, GiftModel>('Gift', giftSchema);


const giftSendSchema = new Schema<IGiftSend, GiftSendModel>({
  gift: {
    type: Schema.Types.ObjectId,
    ref: 'Gift',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: false,
  },
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: false,
  }
}, { timestamps: true });
giftSchema.index({chatId:1})
export const GiftSend = model<IGiftSend, GiftSendModel>('GiftSend', giftSendSchema);