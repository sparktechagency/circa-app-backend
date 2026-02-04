import { Model, Types } from 'mongoose';
import { IFeatures } from '../plan/plan.interface';

export type ISubscription = {
  user:Types.ObjectId,
  plan:Types.ObjectId,
  name:string,
  creator:Types.ObjectId,
  status:"active" | "inactive" | "cancel" | "expire",
  start_date:Date,
  recuring?:"Free" | "Monthly" | "Yearly",
  end_date:Date,
  price:number,
  features: IFeatures[],
  payment_intent_id?:string
  trxId?:string
};


export type SubscriptionModel = Model<ISubscription>;
