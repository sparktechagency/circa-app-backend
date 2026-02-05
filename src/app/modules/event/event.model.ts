import { Schema, model } from 'mongoose';
import { IEvent, EventModel } from './event.interface'; 

const eventSchema = new Schema<IEvent, EventModel>({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  start_date: {
    type: Date,
  },
  end_date: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'delete'],
    default: 'active',
  },
  gifts: {
    type: [Schema.Types.ObjectId],
    ref: 'Gift',
  }
}, { timestamps: true });

export const Event = model<IEvent, EventModel>('Event', eventSchema);
