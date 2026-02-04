import { JwtPayload } from 'jsonwebtoken';
import { IMessage, IMessageSession } from './message.interface';
import { Message } from './message.model';
import { Chat } from '../chat/chat.model';
import { MessageHelper } from './message.helper';
import QueryBuilder from '../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { CreditWallet } from '../wallet/wallet.model';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { USER_ROLES } from '../../../enums/user';

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
      console.log("hello");
      
      io.emit(`chatList::${payload?.sender}`, response);
    } else {
      io.emit(`chatList::${payload?.sender}`, response);
      io.emit(`chatList::${receiver}`, response);
    }
  }

  await Chat.findOneAndUpdate({ _id: payload.chatId }, {});

  return response;
};

const getMessageFromDB = async (
  id: any,
  query: Record<string, any>,
  user: JwtPayload,
) => {
  const seenAllMessage = await Message.updateMany(
    { chatId: id, seenBy: { $nin: [user?.id] } },
    { $push: { seenBy: user?.id } },
  );
  const chat = await Chat.findById(id);
  if (!chat) throw new Error('Chat not found');
  const anotherParticipant = chat.participants.filter(
    participant => participant.toString() !== user?.id,
  )[0];

  const MessageQuery = new QueryBuilder(Message.find({ chatId: id }), query)
    .paginate()
    .sort();
  const [messages, pagination] = await Promise.all([
    MessageQuery.modelQuery.lean(),
    MessageQuery.getPaginationInfo(),
  ]);

  return {
    pagination,
    messages: messages.map((message: any) => {
      return {
        ...message,
        seen: message.seenBy
          .map((id: string) => id.toString())
          .includes(anotherParticipant.toString()),
      };
    }),
  };
};

const purchaseMessageCredit = async (user: JwtPayload,chatId:string) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(StatusCodes.BAD_REQUEST, 'Chat not found');
  const anotherParticipant = chat.participants.filter(
    participant => participant.toString() !== user?.id,
  )[0]

  const creditWallet = (await CreditWallet.findOne({user:user.id},{credit:1}).lean())?.credit as number
  if(!creditWallet || creditWallet < 5) throw new ApiError(StatusCodes.BAD_REQUEST, 'You don\'t have enough credits');
  
  const payload = {
    chatId:chatId,
    ...(user.role == USER_ROLES.FAN ? {fan:user.id,creator:anotherParticipant} : {fan:anotherParticipant,creator:user.id}),
    messageCount:20
  }
  await kafkaProducer.sendMessage("chat",{
    type:"purchase-message",
    data:payload
  })
  return true
};

export const MessageService = { sendMessageToDB, getMessageFromDB, purchaseMessageCredit };
