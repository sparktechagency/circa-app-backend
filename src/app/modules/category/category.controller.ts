import { Request, Response, NextFunction } from 'express';
import { CategoryServices } from './category.service';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
const createCategory = catchAsync(async (req: Request, res: Response) => {
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    const result = await CategoryServices.createCategory(data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Category created successfully',
      data: result,
    })
})

const getAllCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryServices.getAllCategory(req.query);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Category data retrieved successfully',
      data: result,
    })
})
const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    const result = await CategoryServices.updateCategory(id, data);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Category updated successfully',
      data: result,
    })
})
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CategoryServices.deleteCategory(id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Category deleted successfully',
      data: result,
    })
})
export const CategoryController = {
    createCategory,
    getAllCategory,
    updateCategory,
    deleteCategory
};
