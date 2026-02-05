import { Model, Types } from 'mongoose';

export type IGift = {
  name: string;
  image: string;
  credit: number;
  status: 'active' | 'delete';
};

export type GiftModel = Model<IGift>;


export type ISendGiftPayload = {
  gift:Types.ObjectId,
  receivers:Types.ObjectId[],
  event?:Types.ObjectId,
}

export type IGiftSend = {
  gift:Types.ObjectId,
  sender:Types.ObjectId,
  receiver:Types.ObjectId,
  event?:Types.ObjectId,
  chatId?:Types.ObjectId
}

export type GiftSendModel = Model<IGiftSend>;