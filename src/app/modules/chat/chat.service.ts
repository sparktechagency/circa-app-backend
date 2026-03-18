import { Jwt, JwtPayload } from 'jsonwebtoken';
import { IMessage } from '../message/message.interface';
import { Message, MessageSession } from '../message/message.model';
import { IChat } from './chat.interface';
import { Chat } from './chat.model';
import { USER_ROLES } from '../../../enums/user';
import { Subscription } from '../subscription/subscription.model';
import { IPlan } from '../plan/plan.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { GiftSend } from '../gift/gift.model';
import { Creator } from '../user/user.model';

const createChatToDB = async (payload: any,user:JwtPayload): Promise<IChat> => {
    const isExistChat: IChat | null = await Chat.findOne({
        participants: { $all: payload },
    });
    
    if (isExistChat) {
        return isExistChat;
    }
    const subscription = user.role == USER_ROLES.FAN ? await Subscription.findOne({user:user.id,creator:payload[1],status:'active'}) : await Subscription.findOne({user:payload[1],creator:user.id,status:'active'})

    // if(!subscription){
    //     throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not subscribed to this creator')
    // }

    const chat: IChat = await Chat.create({ participants: payload });
    await RedisHelper.keyDelete(`myChats:${user.id}:*`);
    await RedisHelper.keyDelete(`myChats:${payload[1]}:*`);
    return chat;
}

const getChatFromDB = async (user: JwtPayload, search: string): Promise<IChat[]> => {
    // await Creator.updateMany({},{amazon_wishlist_link:'https://www.amazon.com/hz/wishlist/intro'})
    const cache = await RedisHelper.redisGet(`myChats:${user.id}`,{search});
    if (cache) return cache;
    let initQuery =  { participants:{$in:[user.id]} }
    const chats: any = await Chat.find(initQuery)
        .populate({
            path: 'participants',
            select: '_id name image contact date_of_birth amazon_wishlist_link',
            match: {
            _id: { $ne: user.id }, // Exclude user.id in the populated participants
            ...(search && { name: { $regex: search, $options: 'i' } }), // Apply $regex only if search is valid
            }
        })
        .select('participants status').sort({ updatedAt: -1 });
  
    // Filter out chats where no participants match the search (empty participants)
    const filteredChats = chats?.filter(
        (chat: any) => chat?.participants?.length > 0 && (!search || chat?.participants[0]?.name?.toLowerCase().includes(search.toLowerCase()))
    );
  
    //Use Promise.all to handle the asynchronous operations inside the map
    const chatList: IChat[] = await Promise.all(
        filteredChats?.map(async (chat: any) => {
            const data = chat?.toObject();
            const subscription = (await Subscription.findOne((user.role == USER_ROLES.CREATOR ? ({creator:user.id,user:data?.participants[0]?._id,status:'active'}) : ({creator:data?.participants[0]?._id,user:user.id,status:'active'})),{plan:1}).populate("plan",'name emoji').lean())?.plan as any  as IPlan
            const unreadMessages = await Message.countDocuments({ chatId: chat?._id, seenBy: { $nin: [user.id] },sender:{ $ne: user.id } });
            
            const birthDay = new Date(data?.participants[0]?.date_of_birth)
            
            const todayisBirthDay = data.participants[0]?.date_of_birth ? (birthDay.getDate() === new Date().getDate() && birthDay.getMonth() === new Date().getMonth() ):false
            const lastMessage: IMessage | null = await Message.findOne({ chatId: chat?._id })
            .sort({ createdAt: -1 })
            .select('text createdAt sender');
               const gift = (await GiftSend.findOne({chatId:chat?._id,createdAt:{$gt:new Date(Date.now() - (1000 * 60 * 60 * 24))}},{gift:1}).populate('gift','name image credit').lean())?.gift as any
            const messageSession= (await MessageSession.findOne({chatId:chat?._id}))?.messageCount || 0
    
            return {
                ...data,
                participants:data.participants[0],
                lastMessage: lastMessage || null,
                plan:subscription,
                unreadMessages,
                gift,
                remaningMessage:messageSession,
                todayisBirthDay,
                amazon_wishlist_link:data?.participants[0]?.amazon_wishlist_link
            };
        })
    );
    await RedisHelper.redisSet(`myChats:${user.id}`,chatList,{search},60*60*1);
    return chatList;
};


const singleChatDetails = async (chatId: string,user:JwtPayload) => {
    const chat= await Chat.findById(chatId).populate([{
        path: 'participants',
        select: '_id name image contact',
        match: {
            _id: { $ne: user.id }, // Exclude user.id in the populated participants
            // ...(search && { name: { $regex: search, $options: 'i' } }), // Apply $regex only if search is valid
        }
    }]).select('participants status');
    if (!chat) {
        throw new Error('Chat not found');
    }
    const lastMessage: IMessage | null = await Message.findOne({ chatId: chat?._id })
    .sort({ createdAt: -1 })
    .select('text offer createdAt sender');

  
    return {
        ...chat.toObject(),
        participants:chat?.participants[0],
        lastMessage: lastMessage || null,
    };
}

export const ChatService = { createChatToDB, getChatFromDB, singleChatDetails };