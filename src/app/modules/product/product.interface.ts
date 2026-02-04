import { Model, Types } from 'mongoose';

export type IProduct = {
  name: string;
  price: number;
  description: string;
  image: string;
  status: 'active' | 'delete';
  product_style:"Physical" | "Digital",
  resource_link:string,
  author:Types.ObjectId,
  total_sold:number
};

export type ProductModel = Model<IProduct>;
