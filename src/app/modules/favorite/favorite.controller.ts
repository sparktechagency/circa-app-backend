import { Request, Response, NextFunction } from 'express';
import { FavoriteServices } from './favorite.service';
import sendResponse from '../../../shared/sendResponse';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import catchAsync from '../../../shared/catchAsync';

const makeFavorite = catchAsync(async (req: Request, res: Response) => {

    const result = await kafkaProducer.sendMessage("user", {type:"make-favorite",data:{user:req.user.id,creator:req.params.id}});
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Favorite created successfully',
        data: result,
    });
});


const getFavorites = catchAsync(async (req: Request, res: Response) => {
    const result = await FavoriteServices.favoriteListOfUser(req.user, req.query);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Favorite created successfully',
        data: result.favorites,
        pagination: result.pagination
    });
});

export const FavoriteController = {
    makeFavorite,
    getFavorites
};
