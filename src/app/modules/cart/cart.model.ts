import { Schema, model } from 'mongoose';
import { ICart, CartModel } from './cart.interface'; 
import { getRandomId } from '../../../shared/getRandomId';
import { Product } from '../product/product.model';

const cartSchema = new Schema<ICart, CartModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit_price: {
    type: Number,
    default: 0
  },
  total_price: {
    type: Number,
    default: 0
  },
  cart_id: {
    type: String,
    default:getRandomId('CART',6,'number')
  }
}, { timestamps: true });

cartSchema.index({ user: 1 });

cartSchema.pre('save', async function (next) {
  const productInfo = await Product.findOne({ _id: this.product });
  if(!productInfo) {
    return next()
  }
  this.unit_price = productInfo.price;
  this.total_price = productInfo.price * this.quantity;
  next();
});

cartSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  const query = this.getQuery();

  const cart = await Cart.findOne(query);
  if (!cart) return next();

  let finalQuantity = cart.quantity;

  // CASE 1: $inc.quantity
  if (update?.$inc?.quantity) {
    finalQuantity = cart.quantity + update.$inc.quantity;
  }

  // CASE 2: $set.quantity
  if (update?.$set?.quantity !== undefined) {
    finalQuantity = update.$set.quantity;
  }

  // CASE 3: direct quantity update
  if (update?.quantity !== undefined) {
    finalQuantity = update.quantity;
  }

  const totalPrice = cart.unit_price * finalQuantity;

  // ensure $set exists
  update.$set = update.$set || {};
  update.$set.total_price = totalPrice;

  this.setUpdate(update);
  next();
});


export const Cart = model<ICart, CartModel>('Cart', cartSchema);
