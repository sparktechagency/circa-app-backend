import { Schema, model } from 'mongoose';
import { IPackage, PackageModel } from './package.interface'; 

const packageSchema = new Schema<IPackage, PackageModel>({
  icon: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: false,
    default: 0
  },
  badge: {
    type: String,
    required: false,
  },
  credit: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  }
});

packageSchema.pre('save', async function (next) {
  if(this.price) return next();
  this.price = this.credit * 0.50
  next();
});

packageSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Partial<IPackage>;
 if(update.credit){
  update.price = update.credit * 0.50
 }
  
  next();
});

export const Package = model<IPackage, PackageModel>('Package', packageSchema);
