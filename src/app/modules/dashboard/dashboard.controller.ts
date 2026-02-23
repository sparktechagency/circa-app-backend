import { Request, Response, NextFunction } from 'express';
import { DashboardServices } from './dashboard.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';


const getCreatorAnalatics = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getCreatorAnalatics(req.user, req.query?.type as any,req.query?.category as any);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Dashboard data retrieved successfully',
        data: result,
    });
});


export const DashboardController = {
    getCreatorAnalatics
};
