import express from 'express';
import { SubscriptionController } from './subscription.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.route('/subscribe/:id')
    .post(auth(USER_ROLES.FAN),SubscriptionController.purchasePlanFromStripe)
export const SubscriptionRoutes = router;
