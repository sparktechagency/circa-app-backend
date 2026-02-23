import express from 'express';
import { DashboardController } from './dashboard.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { DashboardValidations } from './dashboard.validation';

const router = express.Router();

router.route("/creator")
    .get(auth(),validateRequest(DashboardValidations.getCreatorAnalaticsZodSchema),DashboardController.getCreatorAnalatics)
export const DashboardRoutes = router;
