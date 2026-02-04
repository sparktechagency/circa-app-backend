
import { USER_ROLES } from "../../../enums/user";
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
export const MessageHelper = {
    sendSocketMessageToAdmins
}