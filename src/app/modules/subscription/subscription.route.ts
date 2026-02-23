import express from 'express';
import { SubscriptionController } from './subscription.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.route('/subscribe/:id')
    .post(auth(USER_ROLES.FAN),SubscriptionController.purchasePlanFromStripe)
    .get(auth(USER_ROLES.FAN),SubscriptionController.getSubscription)
router.route("/creators").get(auth(USER_ROLES.FAN),SubscriptionController.getAllSubscriptions)
router.post("/join-free/:id",auth(USER_ROLES.FAN),SubscriptionController.joinCreatorForFree)
export const SubscriptionRoutes = router;
