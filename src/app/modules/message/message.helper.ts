
import { USER_ROLES } from "../../../enums/user";
import { RedisHelper } from "../../../tools/redis/redis.helper";
import { User } from "../user/user.model";
import { IMessage } from "./message.interface";

const sendSocketMessageToAdmins = async (message:IMessage)=>{
    const admins = await User.find({ role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] }}).select('_id');
    const adminIds = admins.map(admin => admin._id.toString());
    console.log(adminIds);
    
    const io = global.socketServer;
    if(io){
        adminIds.forEach(adminId => {
            io.emit(`chatList::${adminId}`, message);
        });
    }
}

const addMessageToCache = async (message:IMessage)=>{
    const cache = await RedisHelper.redisGet(`messages:${message?.chatId}`, {});
    console.log(cache);
    
    if(cache){
        await RedisHelper.redisSet(`messages:${message?.chatId}`, {
            messages: [...cache.messages, message],
            pagination: cache.pagination
        }, {}, 240);
    }
}
export const MessageHelper = {
    sendSocketMessageToAdmins,
    addMessageToCache
}