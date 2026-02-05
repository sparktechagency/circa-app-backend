import { Model, Types } from 'mongoose';

export type IMessage = {
  chatId: Types.ObjectId;
  sender: Types.ObjectId;
  text?: string;
  image?: string[];
  type: 'text' | 'image' | 'document' | 'zoom-link' | 'gift';
  seenBy?: Types.ObjectId[];
  seen?: boolean;
  docs?: string[];
  acctualImage?: string;
  gift?: Types.ObjectId;
};

export type MessageModel = Model<IMessage, Record<string, unknown>>;

export type IMessageSession = {
  chatId: Types.ObjectId;
  fan: Types.ObjectId;
  creator: Types.ObjectId;
  messageCount: number;
};

export type IMessageSessionModel = Model<
  IMessageSession,
  Record<string, unknown>
>;
