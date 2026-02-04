import mongoose from 'mongoose';
import Stripe from 'stripe';
import { Order } from '../app/modules/order/order.model';
import ApiError from '../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Transaction } from '../app/modules/transaction/transaction.model';
import {
  TRANSACTION_CATEGORY,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '../enums/transaction';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../app/modules/notification/notification.interface';
import { Cart } from '../app/modules/cart/cart.model';
import { RedisHelper } from '../tools/redis/redis.helper';

export const handleOrderPurchase = async (
  orderSession: Stripe.Checkout.Session,
) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const { userId, orderId } = orderSession?.metadata as any;

    const orderDetails = await Order.findById(orderId)
      .populate(['user', 'creator'])
      .session(session);

    if (!orderDetails) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Order doesn't exist!");
    }

    const transaction = (
      await Transaction.create(
        [
          {
            user: userId,
            total_price: orderDetails.price_breakdown.total_price,
            payment_received: 0,
            discount_percentage: 0,
            discount_amount: 0,
            platform_fee: orderDetails.price_breakdown.serviceFee,
            status: TRANSACTION_STATUS.SUCCESS,
            type: TRANSACTION_TYPE.DEBIT,
            category: TRANSACTION_CATEGORY.SHOP,
            order: orderId,
          },
        ],
        { session },
      )
    )[0];

    await Promise.all([

      await Order.findOneAndUpdate(
        { _id: orderId },
        {
          payment_status: 'paid',
          payment_intent_id: orderSession.payment_intent,
          transaction_id: transaction.transaction_id,
        },
      ).session(session),
      await Cart.deleteMany({ user: userId }).session(session),
      await RedisHelper.keyDelete(`myCart:${userId}:*`),

      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `Your order has been placed!`,
          message: `You have successfully placed your order. Please check your order details for more information.`,
          receiver: [orderDetails.user._id],
          isRead: false,
          filePath: 'order',
          referenceId: orderId,
        } as INotification,
      }),

      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `You got a new order from ${(orderDetails.user as any).name}`,
          message: `Please check your order details for more information.`,
          receiver: [orderDetails?.creator?._id!],
          isRead: false,
          filePath: 'order',
          referenceId: orderId,
        } as INotification,
      }),

      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: `${(orderDetails.user as any).name} has placed an order`,
          message: `Please check your order details for more information.`,
          isRead: false,
          filePath: 'order',
          referenceId: orderId,
        } as INotification,
      }),
    ]);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    await Order.findByIdAndDelete(orderSession.metadata?.orderId);
    console.log(error);
  }
};
