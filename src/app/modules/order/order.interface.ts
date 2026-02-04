import { Model, Types } from 'mongoose';
import { ORDER_STATUS } from '../../../enums/order';

export type IOrder = {
  user:Types.ObjectId,
  items:{
    _id:Types.ObjectId,
    name:string,
    image:string,
    quantity:number,
    unit_price:number,
    total_price:number
  }[],
  payment_status: 'pending' | 'paid'
  status:ORDER_STATUS,
  order_id:string,
  payment_intent_id?:string,
  transaction_id?:string,
  creator?:Types.ObjectId,
  discount_percentage?:number,
  discount_amount?:number,
  price_breakdown:{
    subtotal:number,
    serviceFee:number,
    discount_amount:number,
    delivery_charge:number,
    total_price:number,
    tax:number,
    products_price:number
  },
  formatted_address:string,
  address_breakdown:{
    country?:string,
    city?:string,
    postal_code?:string,
    street_address?:string
  },
  contact_number:string,
  total_items?:number
};

export type OrderModel = Model<IOrder>;


export type OrderPayload = {
  country?:string,
  city?:string,
  postal_code?:string,
  street_address?:string,
  contact_number:string
}
