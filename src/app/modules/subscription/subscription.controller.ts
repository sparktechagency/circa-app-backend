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


const getSubscription = catchAsync(async (req: Request, res: Response) => {
    const result = await SubscriptionServices.getSubscription(req.user,req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Subscription data retrieved successfully',
        data: result,
    });
});

const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
    const result = await SubscriptionServices.getMySubscriptionCreators(req.user,req.query);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Subscription data retrieved successfully',
        data: result.subscriptions,
        pagination: result.pagination
    });
});


const joinCreatorForFree = catchAsync(async (req: Request, res: Response) => {
    const result = await SubscriptionServices.joinCreatorForFree(req.user,req.params.id as any);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Subscription data retrieved successfully',
        data: result,
    });
})


const getMemberListOFCreator = catchAsync(async (req: Request, res: Response) => {
    const result = await SubscriptionServices.getMemberListOFCreator(req.user);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Subscription data retrieved successfully',
        data: result.subscriptions,
        pagination: result.pagination
    });
})



export const SubscriptionController = {
    purchasePlanFromStripe,
    getSubscription,
    getAllSubscriptions,
    joinCreatorForFree,
    getMemberListOFCreator
};
