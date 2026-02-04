import { Request, Response, NextFunction } from 'express';
import { PackageServices } from './package.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createPackage = catchAsync(async (req: Request, res: Response) => {
    const { ...data } = req.body;
    const result = await PackageServices.createPackage(data);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Package created successfully',
        data: result,
    });
});

const getAllPackages = catchAsync(async (req: Request, res: Response) => {
    const result = await PackageServices.getAllPackages();
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Package data retrieved successfully',
        data: result,
    });
});

const updatePackage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...data } = req.body;
    const result = await PackageServices.updatePackage(id, data);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Package updated successfully',
        data: result,
    });
});

const deletePackage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PackageServices.deletePackage(id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Package deleted successfully',
        data: result,
    });
});


const purchasePackageForCredit = catchAsync(async (req: Request, res: Response) => {

    const result = await PackageServices.purchasePackageForCredit(req.user,req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Package created successfully',
        data: result,
    });
})

export const PackageController = {
    createPackage,
    getAllPackages,
    updatePackage,
    deletePackage,
    purchasePackageForCredit
};
