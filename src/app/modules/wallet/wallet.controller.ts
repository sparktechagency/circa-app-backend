import { Request, Response, NextFunction } from 'express';
import { WalletServices } from './wallet.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const withdrawMoney = catchAsync(async (req: Request, res: Response) => {
    const { amount } = req.body;
    const result = await WalletServices.withdrawMoney(req.user, amount);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Wallet data retrieved successfully',
        data: result,
    });
});


const getWallet = catchAsync(async (req: Request, res: Response) => {
    const result = await WalletServices.getWallet(req.user);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Wallet data retrieved successfully',
        data: result,
    });
});


export const WalletController = {
    withdrawMoney,
    getWallet
};
