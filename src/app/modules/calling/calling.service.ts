import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { Chat } from "../chat/chat.model";
import { CallingHelper } from "./calling.helper";
import { JwtPayload } from "jsonwebtoken";
import { CallingSession } from "./calling.model";

const subscribeCallingchannel =async (channelName:string,uid:number,type:"audio"|"video",chatId:string,user:JwtPayload) => {
    const chat = await Chat.findOne({ _id: chatId });
    if(!chat){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Chat not found');
    }

    if(!chat.participants.includes(user.id)){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not part of this chat');
    }
    const participant = chat.participants.filter(participant => participant.toString() !== user?.id)[0];

    if(!participant){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Participant not found');
    }

    const io = global.socketServer;
    const token = await CallingHelper.generateAgoraCallingToken(channelName,uid);
    if(io){
        io.emit(`incomingCall::${participant}`, {channelName,uid,type,token,chatId});
    }

    await CallingSession.create({channelName,uid,type,owner:user.id,chatId,reciever:participant});

    return {token,channelName,uid,type,chatId};
}

const changeCallingStatus = async (channelName:string,uid:number,status:"pending" | "accepted" | "rejected" | "ended" |"cancelled",user:JwtPayload) => {
    const session = await CallingSession.findOne({channelName,uid});
    if(!session){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Session not found');
    }

    if(['accepted','rejected',].includes(status) && session.status !== 'pending'){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Call session is not start yet');
    }
    const io = global.socketServer!
    switch (status) {
        case 'accepted':
        session.status = 'accepted';
        session.startedAt = new Date();
        await session.save();
        io.emit(`call-status::${uid}`, {channelName,uid,status,chatId:session.chatId});
        break;
    case 'rejected':
        session.status = 'rejected';
        session.endedAt = new Date();
        await session.save();
        io.emit(`call-status::${uid}`, {channelName,uid,status,chatId:session.chatId});
        break;
    case 'ended':
        session.status = 'ended';
        session.endedAt = new Date();
        await session.save();
        io.emit(`call-status::${uid}`, {channelName,uid,status,chatId:session.chatId});
        break;
    case 'cancelled':
        session.status = 'cancelled';
        session.endedAt = new Date();
        await session.save();
        io.emit(`call-status::${uid}`, {channelName,uid,status,chatId:session.chatId});
        break;
    }

    return {channelName,uid,status,chatId:session.chatId};
    
}

export const CallingServices = {
    subscribeCallingchannel,
    changeCallingStatus
};
