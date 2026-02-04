import { Schema, model } from 'mongoose';
import { IProduct, ProductModel } from './product.interface'; 

const productSchema = new Schema<IProduct, ProductModel>({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'delete'],
    default: 'active',
  },
  product_style: {
    type: String,
    enum: ['Physical', 'Digital'],
    required: false,
    default: 'Physical',
  },
  resource_link: {
    type: String,
    required: false,
    select: false
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  total_sold: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

productSchema.index({user:1})
export const Product = model<IProduct, ProductModel>('Product', productSchema);
