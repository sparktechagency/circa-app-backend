import { Schema, model } from 'mongoose';
import { IOrder, OrderModel } from './order.interface'; 
import { ORDER_STATUS } from '../../../enums/order';
import { getRandomId } from '../../../shared/getRandomId';

const orderSchema = new Schema<IOrder, OrderModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: {
    type: [Object],
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ORDER_STATUS,
    default: ORDER_STATUS.PENDING,
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  order_id: {
    type: String,
    default: getRandomId('ORD',5,'number')
  },
  payment_intent_id: {
    type: String,
  },
  transaction_id: {
    type: String,
  },
  price_breakdown: {
    type: Object,
    default: {
      subtotal: 0,
      serviceFee: 0,
      discount_amount: 0,
      delivery_charge: 0,
      total_price: 0,
      tax: 0,
      products_price: 0
    }
  },
  total_items: {
    type: Number,
    default: 0
  },
  formatted_address: {
    type: String,
    default: ''
  },
  address_breakdown: {
    type: Object,
    default: {}
  },
  contact_number: {
    type: String,
    default: ''
  },
  discount_percentage: {
    type: Number,
    default: 0
  },
  discount_amount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export const Order = model<IOrder, OrderModel>('Order', orderSchema);
