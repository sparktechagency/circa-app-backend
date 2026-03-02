import { JwtPayload } from 'jsonwebtoken';
import { IMessage, IMessageSession } from './message.interface';
import { Message, MessageSession } from './message.model';
import { Chat } from '../chat/chat.model';
import { MessageHelper } from './message.helper';
import QueryBuilder from '../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { CreditWallet } from '../wallet/wallet.model';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { USER_ROLES } from '../../../enums/user';
import { User } from '../user/user.model';
import { RedisHelper } from '../../../tools/redis/redis.helper';

const sendMessageToDB = async (
  payload: Partial<IMessage> & { isCustom?: boolean },
): Promise<IMessage> => {
  // save to DB

  const response = await Message.create(payload);

  const receiver = (await Chat.findById(payload.chatId))?.participants.filter(
    participant => (participant?.toString() as any) != payload?.sender!,
  )[0];

  //@ts-ignore
  const io = global.socketServer;
  if (io) {
    console.log('dsds');

    io.emit(`getMessage::${payload?.chatId}`, response);
    if (!receiver) {
      console.log('hello');

      io.emit(`chatList::${payload?.sender}`, response);
    } else {
      io.emit(`chatList::${payload?.sender}`, response);
      io.emit(`chatList::${receiver}`, response);
    }
  }

  if (response.text) {
    await kafkaProducer.sendMessage('chat', {
      type: 'check-message',
      data: {
        message: response.text,
        chat: payload.chatId,
      },
    });
  }

  await Promise.all([
    Chat.findOneAndUpdate({ _id: payload.chatId }, {}),
    RedisHelper.keyDelete(`messages:${payload.chatId}:*`),
    RedisHelper.keyDelete(`myChats:${payload.sender}:*`),
    RedisHelper.keyDelete(`myChats:${receiver}:*`),
  ]);

  const user = await User.findById(payload.sender);

  if (user?.role == USER_ROLES.FAN) {
    await MessageSession.findOneAndUpdate(
      { chatId: payload.chatId },
      { $inc: { messageCount: -1 } },
    );
  }

  return response;
};

const getMessageFromDB = async (
  id: any,
  query: Record<string, any>,
  user: JwtPayload,
) => {
  const cache = await RedisHelper.redisGet(`messages:${id}:${user?.id}`, query);
  if (cache) return cache;
  const seenAllMessage = await Message.updateMany(
    { chatId: id, seenBy: { $nin: [user?.id] } },
    { $push: { seenBy: user?.id } },
  );
  if (seenAllMessage.modifiedCount > 0) {
    const io = global.socketServer;
    await RedisHelper.keyDelete(`chatList:${user?.id}:*`);
    io?.emit(`chatList::${user?.id}`, seenAllMessage);
  }
  const chat = await Chat.findById(id);
  if (!chat) throw new Error('Chat not found');
  const anotherParticipant = chat.participants.filter(
    participant => participant.toString() !== user?.id,
  )[0];

  const MessageQuery = new QueryBuilder(Message.find({ chatId: id }), query)
    .paginate()
    .sort();
  const [messages, pagination] = await Promise.all([
    MessageQuery.modelQuery.populate('gift').select('+acctualImage').lean(),
    MessageQuery.getPaginationInfo(),
  ]);

  const data = {
    pagination,
    messages: messages.map((message: any) => {
      const image =
        user.role == USER_ROLES.FAN && message?.acctualImage
          ? message?.image
          : message?.acctualImage;
      delete message.acctualImage;
      return {
        ...message,
        seen: message.seenBy
          .map((id: string) => id.toString())
          .includes(anotherParticipant.toString()),
        image,
      };
    }),
  };

  await RedisHelper.redisSet(`messages:${id}:${user?.id}`, data, query, 240);
  return data;
};

const purchaseMessageCredit = async (user: JwtPayload, chatId: string) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(StatusCodes.BAD_REQUEST, 'Chat not found');
  const anotherParticipant = chat.participants.filter(
    participant => participant.toString() !== user?.id,
  )[0];

  const creditWallet = (
    await CreditWallet.findOne({ user: user.id }, { credit: 1 }).lean()
  )?.credit as number;
  if (!creditWallet || creditWallet < 5)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You don't have enough credits",
    );

  const payload = {
    chatId: chatId,
    ...(user.role == USER_ROLES.FAN
      ? { fan: user.id, creator: anotherParticipant }
      : { fan: anotherParticipant, creator: user.id }),
    messageCount: 20,
  };
  await kafkaProducer.sendMessage('chat', {
    type: 'purchase-message',
    data: payload,
  });
  return true;
};

const purchaseImagesCredit = async (user: JwtPayload, messageId: string) => {
  const creditWallet = (
    await CreditWallet.findOne({ user: user.id }, { credit: 1 }).lean()
  )?.credit as number;
  if (!creditWallet || creditWallet < 10)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You don't have enough credits",
    );
  const payload = {
    user: user.id,
    image: messageId,
  };
  await kafkaProducer.sendMessage('chat', {
    type: 'purchase-images',
    data: payload,
  });
  return true;
};

export const MessageService = {
  sendMessageToDB,
  getMessageFromDB,
  purchaseMessageCredit,
  purchaseImagesCredit,
};
