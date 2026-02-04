import { Request, Response, NextFunction } from 'express';
import { CartServices } from './cart.service';
import sendResponse from '../../../shared/sendResponse';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';

const addProductIntoCart = async (req: Request, res: Response) => {
    const { ...data } = req.body;
    data.user = req.user.id
    await kafkaProducer.sendMessage("cart", {type:"add-product",data})
    sendResponse(res, {
        statusCode: 200,
        success: true,
        data: data,
        message: 'Product added to cart successfully',
    });
};

const increaseOrDecreaseQuantity = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount } = req.body;
    await CartServices.increaseOrDecreaseQuantity(id, amount);
    // await kafkaProducer.sendMessage("cart", {type:"update-quantity",data:{id,amount}})
    sendResponse(res, {
        statusCode: 200,
        success: true,
        data: amount,
        message: 'Product quantity updated successfully',
    });
};

const deleteProductFromCart = async (req: Request, res: Response) => {
    const { id } = req.params;
    await kafkaProducer.sendMessage("cart", {type:"delete-product",data:id})
    sendResponse(res, {
        statusCode: 200,
        success: true,
        data: id,
        message: 'Product deleted from cart successfully',
    });
};

const getCart = async (req: Request, res: Response) => {
    const result = await CartServices.getCartOfUser(req.user);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        data: result,
        message: 'Cart data retrieved successfully',
    });
};


export const CartController = {
    addProductIntoCart,
    increaseOrDecreaseQuantity,
    deleteProductFromCart,
    getCart
};
