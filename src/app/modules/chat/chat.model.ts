import { model, Schema } from 'mongoose';
import { ChatModel, IChat } from './chat.interface';

const chatSchema = new Schema<IChat, ChatModel>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        status: {
            type: Boolean,
            default: true
        },
        isAdminChat: {
            type: Boolean,
            default: false
        }
    },{
        timestamps: true
    }
)

export const Chat = model<IChat, ChatModel>('Chat', chatSchema);