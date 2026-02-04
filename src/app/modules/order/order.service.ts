import { Types } from 'mongoose';
import { OrderPayload } from './order.interface';
import { Cart } from '../cart/cart.model';
import { CartHelper } from '../cart/cart.helper';
import { Product } from '../product/product.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Order } from './order.model';
import config from '../../../config';
import stripe from '../../../config/stripe';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import QueryBuilder from '../../builder/QueryBuilder';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { ORDER_STATUS } from '../../../enums/order';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { PlanHelper } from '../plan/plan.hepler';
import { FEATURES_LIST_STATUS } from '../../../enums/features';

const createOrderIntoDB = async (user: JwtPayload, payload: OrderPayload) => {
  const cartItems = await Cart.find({ user: user.id })
    .populate('product', 'name image')
    .lean()
    .exec();

  if (!cartItems.length)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cart is empty!');
  const creator = await Product.findOne(
    { _id: cartItems[0].product },
    { author: 1 },
  )
    .lean()
    .exec();
  if (!creator)
    throw new ApiError(StatusCodes.BAD_REQUEST, "Product doesn't exist!");
  const discount = await PlanHelper.isDiscountAvailable(
    user.id,
    creator?.author,
    FEATURES_LIST_STATUS.SHOP_DISCOUNT,
    89,
  );
  const price_breakdown = CartHelper.calculateThePrice(cartItems,discount);

  const mapItems = cartItems.map((item: any) => ({
    name: item.product.name,
    image: item.product.image,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    _id: item._id,
  }));

  const order = {
    user: user.id,
    items: mapItems,
    address_breakdown: payload,
    price_breakdown,
    contact_number: payload.contact_number,
    formatted_address: `${payload.country},${payload.city},${payload.postal_code},${payload.street_address}`,
    creator: creator.author,
    total_items: cartItems.length,
    discount_percentage: discount,
    discount_amount: discount
      ? (price_breakdown.total_price * discount) / 100
      : 0,
  };

  const line_items = cartItems.map((item: any) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.product.name,
        images: [
          `http://${config.ip_address}:${config.port}/files/${item.product.image}`,
        ],
      },
      unit_amount: item.unit_price * 100,
    },
    quantity: item.quantity,
  }));

  if (price_breakdown.delivery_charge) {
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Delivery Charge',
          images: [],
        },
        unit_amount: price_breakdown.delivery_charge * 100,
      },
      quantity: 1,
    });
  }

  if (price_breakdown.serviceFee) {
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Service Fee',
          images: [],
        },
        unit_amount: price_breakdown.serviceFee * 100,
      },
      quantity: 1,
    });
  }

  if (price_breakdown.tax) {
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Tax',
          images: [],
        },
        unit_amount: price_breakdown.tax * 100,
      },
      quantity: 1,
    });
  }

  const createOrder = await Order.create(order);
  let coupon = '';
  if (discount) {
    coupon = (
      await stripe.coupons.create({
        percent_off: discount,
        currency: 'usd',
        duration: 'once',
      })
    ).id;
  }
  if (!createOrder)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Order not created!');
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: line_items,
    ...(coupon && {
      discounts: [
        {
          coupon: coupon,
        },
      ],
    }),
    mode: 'payment',
    success_url: 'https://www.example.com/success',
    cancel_url: 'https://www.example.com/cancel',
    metadata: { userId: user.id!, orderId: createOrder._id.toString()! },
  });
  if (!session.url)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Order not created!');
  return session.url;
};

const getMyOrderFromDB = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const cache = await RedisHelper.redisGet(`myOrders:${user.id}`, query);
  if (cache) return cache;
  const initQuery = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(
    user.role,
  )
    ? { payment_status: 'paid' }
    : {
        $or: [{ user: user.id }, { creator: user.id }],
        payment_status: 'paid',
      };

  const orderQuery = new QueryBuilder(Order.find(initQuery), query)
    .paginate()
    .sort()
    .filter()
    .search(['title', 'description', 'order_id', 'transaction_id']);

  const [orders, pagination] = await Promise.all([
    orderQuery.modelQuery
      .populate('user', 'name email image')
      .populate('creator', 'name email image')
      .exec(),
    orderQuery.getPaginationInfo(),
  ]);

  await RedisHelper.redisSet(
    `myOrders:${user.id}`,
    { orders, pagination },
    query,
    240,
  );
  return { orders, pagination };
};

const changeOrderStatus = async (orderId: string, status: ORDER_STATUS) => {
  const order = await Order.findOne({ _id: orderId })
    .populate('user', 'name email image')
    .populate('creator', 'name email image')
    .exec();
  if (!order) throw new ApiError(StatusCodes.BAD_REQUEST, 'Order not found!');
  if ([ORDER_STATUS.DELIVERD, ORDER_STATUS.CANCELLED].includes(order.status))
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Order already' + order.status + '!',
    );

  if (status === ORDER_STATUS.PROCESSING) {
    await Order.findOneAndUpdate(
      { _id: orderId },
      { status: ORDER_STATUS.PROCESSING },
    );
    await Promise.all([
      await kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `Your order has been ${ORDER_STATUS.PROCESSING}`,
          message: `${(order?.creator as any)?.name} has marked your order as ${ORDER_STATUS.PROCESSING}`,
          isRead: false,
          filePath: 'order',
          receiver: [order.user],
          referenceId: orderId,
        },
      }),
      await kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `Your order has been ${ORDER_STATUS.PROCESSING}`,
          message: `${(order?.creator as any)?.name} has marked your order as ${ORDER_STATUS.PROCESSING}`,
          isRead: false,
          filePath: 'order',
          receiver: [order.creator],
          referenceId: orderId,
        },
      }),
    ]);
  }

  if (status == ORDER_STATUS.CANCELLED) {
    await kafkaProducer.sendMessage('cart', {
      type: 'cancel-order',
      data: orderId,
    });
  }

  return order;
};

export const OrderServices = {
  createOrderIntoDB,
  getMyOrderFromDB,
  changeOrderStatus,
};
