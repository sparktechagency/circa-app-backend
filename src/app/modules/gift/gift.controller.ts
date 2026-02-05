import { Request, Response, NextFunction } from 'express';
import { GiftServices } from './gift.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createGift = catchAsync(async (req: Request, res: Response) => {
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    const result = await GiftServices.createGiftIntoDb(data);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Gift created successfully',
        data: result,
    });
});

const getAllGifts = catchAsync(async (req: Request, res: Response) => {
    const result = await GiftServices.getGiftsFromDB(req.query);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Gift data retrieved successfully',
        data: result.gifts,
        pagination: result.pagination
    });
});


const updateGift = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    const result = await GiftServices.updateGiftIntoDb(id, data);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Gift updated successfully',
        data: result,
    });
});


const deleteGift = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await GiftServices.deleteGiftFromDB(id);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Gift deleted successfully',
        data: result,
    });
});


const sendGiftToCreators = catchAsync(async (req: Request, res: Response) => {
    const result = await GiftServices.sendGiftToCreators(req.user, req.body);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Gift sent successfully',
        data: result,
    });
})

export const GiftController = {
    createGift,
    getAllGifts,
    updateGift,
    deleteGift,
    sendGiftToCreators
};
