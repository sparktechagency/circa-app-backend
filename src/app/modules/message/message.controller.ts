import { Request, Response } from 'express';

import { StatusCodes } from 'http-status-codes';
import { MessageService } from './message.service';
import {
  getMultipleFilesPath,
  getSingleFilePath,
} from '../../../shared/getFilePath';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { MessageSession } from './message.model';
import ApiError from '../../../errors/ApiError';
import { Chat } from '../chat/chat.model';

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = (req.user as any).id;

  let image = getSingleFilePath(req.files, 'image');
  const docs = getMultipleFilesPath(req.files, 'doc');

  const payload = {
    ...req.body,
    sender: user,
    docs: docs || [],
    ...(image && { acctualImage: image, image: '/lock-photo.jpg' }),
  };

  if (!payload.chatId?.includes(',')) {
    const chat = await Chat.findById(payload.chatId);
    if (!chat) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Chat not found');
    }
    if (chat.status == 'block') {
      throw new ApiError(StatusCodes.BAD_REQUEST, chat.blockReason);
    }
    const session = await MessageSession.findOne({
      chatId: payload.chatId,
    }).lean();

    if (!session || session.messageCount <= 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "You don't have enough credits",
      );
    }
  }

  await kafkaProducer.sendMessage('chat', { type: 'create', data: payload });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Send Message Successfully',
    data: payload,
  });
});

const getMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const query = req.query;
  const user = req.user as any;
  const messages = await MessageService.getMessageFromDB(id, query, user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message Retrieve Successfully',
    data: messages,
  });
});

const buyMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MessageService.purchaseMessageCredit(req.user, id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Message Purchased Successfully',
    data: result,
  });
});

const buyImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MessageService.purchaseImagesCredit(req.user, id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Image Purchased Successfully',
    data: result,
  });
});

export const MessageController = {
  sendMessage,
  getMessage,
  buyMessage,
  buyImage,
};
