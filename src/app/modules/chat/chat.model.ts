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
            type: String,
            enum: ['active', 'delete', 'block', 'warning'],
            default: 'active'
        },
        isAdminChat: {
            type: Boolean,
            default: false
        },
        blockReason: {
            type: String
        }
    },{
        timestamps: true
    }
)

export const Chat = model<IChat, ChatModel>('Chat', chatSchema);