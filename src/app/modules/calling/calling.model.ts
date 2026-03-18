import mongoose from "mongoose";
import { CallSessionModel, ICallSession } from "./calling.interface";

const callingSessionSchema = new mongoose.Schema<ICallSession,CallSessionModel>({
    channelName: {
        type: String,
        required: true
    },
    uid: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'ended', 'cancelled'],
        default: 'pending'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reciever: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    startedAt: {
        type: Date,
        required: false
    },
    endedAt: {
        type: Date,
        required: false
    }
}, { timestamps: true });

export const CallingSession = mongoose.model<ICallSession,CallSessionModel>('CallingSession', callingSessionSchema);