import { Model, Types } from 'mongoose';

export type IEvent = {
  name : string,
  image : string,
  gifts?:Types.ObjectId[],
  description ?: string
  start_date ?: Date,
  end_date ?: Date,
  status ?: 'active' | 'delete'
};

export type EventModel = Model<IEvent>;
