import { Schema, model } from 'mongoose';
import { ISubscription, SubscriptionModel } from './subscription.interface'; 
import { SubscriptionHelper } from './subscription.helper';

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    default: ''
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  recuring: {
    type: String,
    enum: ['Free', 'Monthly', 'Yearly'],
    default: 'Free',
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancel', 'expire'],
    default: 'active',
  },
  start_date: {
    type: Date,
  },
  end_date: {
    type: Date,
  },
  price: {
    type: Number,
    default: 0
  },
  features: {
    type: [Object],
    default: []
  },
  payment_intent_id: {
    type: String,
    default: ''
  },
  trxId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
});

subscriptionSchema.index({ start_date: 1, end_date: 1 });
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ creator: 1,user:1 });

subscriptionSchema.pre('save', async function (next) { 
  const planInfo = await SubscriptionHelper.calculateTheTime(this.plan as any);
  this.start_date =this.start_date || planInfo.startDate;
  this.end_date =this.end_date || planInfo.endDate;
  this.price = planInfo?.plan?.price||0
  this.features = planInfo?.plan?.features||[],
  this.name = planInfo?.plan?.name||''
  this.creator =this.creator || planInfo?.plan?.user as any
  this.recuring = planInfo?.plan?.category
  next();
});
export const Subscription = model<ISubscription, SubscriptionModel>('Subscription', subscriptionSchema);
