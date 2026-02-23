import { Request, Response, NextFunction } from 'express';
import { PlanServices } from './plan.service';

const createPlan = async (req: Request, res: Response) => {
    const user = req.user;
    const payload = req.body;
    payload.user = user.id
    const result = await PlanServices.createPlanOFUserInDB(payload);
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Plan created successfully',
        data: result,
    });
};


const getAllPlans = async (req: Request, res: Response) => {
    const result = await PlanServices.getAllPlans(req.user);
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Plan data retrieved successfully',
        data: result,
    });
};


const getPlansByUserId = async (req: Request, res: Response) => {
    const result = await PlanServices.getAllPlans({ id: req.params.id },req.user?.id as string);
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Plan data retrieved successfully',
        data: result,
    });
};

const updatePlan = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...data } = req.body;
    const result = await PlanServices.updatePlansIntoDb(id, data);
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Plan updated successfully',
        data: result,
    });
};

const deletePlan = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PlanServices.deletePlanFromDB(id);
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Plan deleted successfully',
        data: result,
    });
};


const getFeaturesList = async (req: Request, res: Response) => {
    const result = await PlanServices.getFeaturesList();
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Features list retrieved successfully',
        data: result,
    });
};


export const PlanController = {
    createPlan,
    getAllPlans,
    getPlansByUserId,
    updatePlan,
    deletePlan,
    getFeaturesList
};
