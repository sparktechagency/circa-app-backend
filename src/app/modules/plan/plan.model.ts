import { Schema, model } from 'mongoose';
import { IPlan, PlanModel } from './plan.interface'; 
import { FEATURES_LIST_STATUS } from '../../../enums/features';

const planSchema = new Schema<IPlan, PlanModel>({
  name: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  features: {
    type: [{
      name: {
        type: String,
        enum:Object.values(FEATURES_LIST_STATUS),
        required: true,
      },
      status: {
        type:Boolean,
        required: false,
        default: true
      },
      discount: {
        type: Number,
        required: false,
        default: 0
      }
    }],
    required: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  category: {
    type: String,
    enum: ['Free', 'Monthly', 'Yearly'],
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  emoji: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  fromAdmin: {
    type: Boolean,
    required: false,
    default: false
  }
}, { timestamps: true });


planSchema.index({ user: 1 });

export const Plan = model<IPlan, PlanModel>('Plan', planSchema);
