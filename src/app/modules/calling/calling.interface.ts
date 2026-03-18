import { Model, Types } from "mongoose";

export type ICallSession = {
    channelName: string;
    uid: number;
    type: string;
    status:"pending" | "accepted" | "rejected" | "ended" |"cancelled";
    owner:Types.ObjectId
    chatId:Types.ObjectId,
    reciever:Types.ObjectId
    startedAt?:Date,
    endedAt?:Date

}


export type CallSessionModel = Model<ICallSession>;