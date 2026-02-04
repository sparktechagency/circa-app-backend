import { Request, Response, NextFunction } from 'express';
import { SubscriptionServices } from './subscription.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

const purchasePlanFromStripe = catchAsync(async (req: Request, res: Response) => {
    const result = await SubscriptionServices.purchasePlanFromStripe(req.user,req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Plan purchased successfully',
        data: result,
    });
});



export const SubscriptionController = {
    purchasePlanFromStripe
};
