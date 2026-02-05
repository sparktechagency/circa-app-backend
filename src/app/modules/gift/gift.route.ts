import express from 'express';
import { GiftController } from './gift.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { GiftValidations } from './gift.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.route('/')
    .post(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),fileUploadHandler(),validateRequest(GiftValidations.createGiftZodSchema),GiftController.createGift)
    .get(GiftController.getAllGifts)

router.post("/send-gift",auth(USER_ROLES.FAN),validateRequest(GiftValidations.sendGiftZodSchema),GiftController.sendGiftToCreators)

router.route('/:id')
    .patch(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),fileUploadHandler(),validateRequest(GiftValidations.updateGiftZodSchema),GiftController.updateGift)
    .delete(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),GiftController.deleteGift)

export const GiftRoutes = router;
