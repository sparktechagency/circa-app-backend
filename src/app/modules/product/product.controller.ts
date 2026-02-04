import { Request, Response, NextFunction } from 'express';
import { ProductServices } from './product.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    data.author = req.user.id
    const result = await ProductServices.createProduct(data);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product created successfully',
        data: result,
    });
});

const getAllProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.getAllProducts(req.query, req.user);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product data retrieved successfully',
        data: result.products,
        pagination: result.pagination
    });
});

const getAllProductUsingCreatorId = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.getAllProducts(req.query, {id: req.params.id});
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product data retrieved successfully',
        data: result.products,
        pagination: result.pagination
    });
})

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductServices.getSingleProduct(req.params.id,);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product data retrieved successfully',
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    const result = await ProductServices.updateProduct(id, data);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product updated successfully',
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProductServices.deleteProduct(id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product deleted successfully',
        data: result,
    });
});

export const ProductController = {
    createProduct,
    getAllProduct,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    getAllProductUsingCreatorId
};
