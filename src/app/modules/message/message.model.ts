import { Schema, model } from 'mongoose';
import { IMessage, IMessageSession, MessageModel } from './message.interface';

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Chat',
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: { 
      type: String,
      required: false 
    },
    image: { 
    type: String,
    required: false,
    },
    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    docs:[
      {
        type: String,
    }],
    type:{
      type:String,
      enum:['text','image','document','zoom-link','gift','call'],
      required:false,
      default:'text'
    },
    acctualImage:{
      type:String,
      required:false,
      select:false
    },
    gift: {
      type: Schema.Types.ObjectId,
      ref: 'Gift',
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chatId: 1 });

export const Message = model<IMessage, MessageModel>('Message', messageSchema);


const messageSessionSchema = new Schema<IMessageSession, MessageModel>({
  chatId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Chat',
  },
  fan: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  messageCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });


export const MessageSession = model<IMessageSession>('MessageSession', messageSessionSchema);
