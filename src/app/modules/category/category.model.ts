import { Schema, model } from 'mongoose';
import { ICategory, CategoryModel } from './category.interface'; 

const categorySchema = new Schema<ICategory, CategoryModel>({
  name: {
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
  }
}, { timestamps: true });

export const Category = model<ICategory, CategoryModel>('Category', categorySchema);
