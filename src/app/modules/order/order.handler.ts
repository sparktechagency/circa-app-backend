import mongoose from 'mongoose';
import { ORDER_STATUS } from '../../../enums/order';
import { Order } from './order.model';
import stripe from '../../../config/stripe';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { RedisHelper } from '../../../tools/redis/redis.helper';

export const handleCancelOrder = async (orderId: string) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { status: ORDER_STATUS.CANCELLED },
      { session },
    );
    await Promise.all([
      RedisHelper.keyDelete(`myOrders:${order?.user}:*`),
      RedisHelper.keyDelete(`myOrders:${order?.creator}:*`),
      RedisHelper.adminKeyDelete(`myOrders`),
      stripe.refunds.create({
        payment_intent: order?.payment_intent_id,
      }),

      kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: 'Order Cancelled',
          message: 'Your order has been cancelled',
          isRead: false,
          filePath: 'order',
          receiver: [order?.user, order?.creator],
          referenceId: order?._id,
        },
      }),
    ]);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
  }
};

export const OrderHandler = { handleCancelOrder };
