import { Types } from "mongoose";
import { Chat } from "../app/modules/chat/chat.model";
import { MessageService } from "../app/modules/message/message.service";

const handleStartCall = async (chatId: Types.ObjectId, userId: string) => {
    try {
        await MessageService.sendMessageToDB({
            chatId,
            sender: new Types.ObjectId(userId),
            type: 'call',
            text: 'call started'
        })

    } catch (error) {
        console.log(error);
        
    }
}