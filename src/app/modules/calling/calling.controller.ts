import { Request, Response, NextFunction } from 'express';
import { CallingServices } from './calling.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';

const subscribeCallingchannel = catchAsync(async (req: Request, res: Response) => {
    const { channelName,uid,type,chatId } = req.body;
    const result = await CallingServices.subscribeCallingchannel(channelName,uid,type,chatId,req.user);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Calling data retrieved successfully',
        data: result,
    });
})


const changeCallingStatus = catchAsync(async (req: Request, res: Response) => {
    const { channelName,uid,status } = req.body;
    const result = await CallingServices.changeCallingStatus(channelName,uid,status,req.user);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Calling data retrieved successfully',
        data: result,
    });
})

export const CallingController = {
    subscribeCallingchannel,
    changeCallingStatus
};
