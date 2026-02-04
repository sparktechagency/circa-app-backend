import express from 'express';
import { PlanController } from './plan.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { PlanValidations } from './plan.validation';

const router = express.Router();

router.route('/')
    .post(auth(USER_ROLES.CREATOR),validateRequest(PlanValidations.createPlanZodSchema),PlanController.createPlan)
    .get(auth(),PlanController.getAllPlans)

router.route('/user/:id')
    .get(auth(),PlanController.getPlansByUserId)

router.route('/features')
    .get(auth(),PlanController.getFeaturesList)

router.route('/:id')
    .patch(auth(USER_ROLES.CREATOR),validateRequest(PlanValidations.updatePlanZodSchema),PlanController.updatePlan)
    .delete(auth(USER_ROLES.CREATOR),PlanController.deletePlan)





export const PlanRoutes = router;
