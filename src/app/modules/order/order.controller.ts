import { Request, Response, NextFunction } from 'express';
import { OrderServices } from './order.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const payload = req.body;
    const result = await OrderServices.createOrderIntoDB(user!, payload);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Order created successfully',
        data: result,
    });
});


const getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderServices.getMyOrderFromDB(req.user, req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Order data retrieved successfully',
        data: result.orders,
        pagination: result.pagination
    });
});


export const OrderController = {
    createOrder,
    getAllOrders
};
