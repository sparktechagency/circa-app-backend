import { Model, Types } from 'mongoose';
import { FEATURES_LIST_STATUS } from '../../../enums/features';

export type IPlan = {
  user:Types.ObjectId,
  name: string;
  subtitle: string;
  price: number;
  features: IFeatures[],
  status: 'active' | 'inactive',
  category: "Free" | "Monthly" | "Yearly",
  duration: number,
  emoji: string
};

export type PlanModel = Model<IPlan>;


export interface IFeatures {
  status: boolean;
  name:FEATURES_LIST_STATUS,
  discount?:number
}
