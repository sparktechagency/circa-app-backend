import { Model } from 'mongoose';

export type IPackage = {
  icon: string;
  name:string,
  price?: number;
  badge?:string
  credit: number;
  discount?:number,
  status:'active' | 'inactive',
};

export type PackageModel = Model<IPackage>;
