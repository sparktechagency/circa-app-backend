import express from 'express';
import { OrderController } from './order.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { OrderValidations } from './order.validation';

const router = express.Router();

router.route('/')
    .post(auth(USER_ROLES.FAN),validateRequest(OrderValidations.createOrderZodSchema),OrderController.createOrder)
    .get(auth(),OrderController.getAllOrders)
export const OrderRoutes = router;
