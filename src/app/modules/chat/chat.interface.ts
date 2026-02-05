import { Model, Types } from 'mongoose';

export type IChat = {
    participants: [Types.ObjectId];
    status: "active" | "delete" | "block" | "warning";
    isAdminChat?: Boolean;
    blockReason?: string
}

export type ChatModel = Model<IChat, Record<string, unknown>>;