import { Request, Response, NextFunction } from 'express';
import { TransactionServices } from './transaction.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const getTransactions = catchAsync(async (req: Request, res: Response) => {
    const result = await TransactionServices.getTransactions(req.user, req.query);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Transaction data retrieved successfully',
        data: result.transactions,
        pagination: result.pagination
    });
});


export const TransactionController = {
    getTransactions
};
