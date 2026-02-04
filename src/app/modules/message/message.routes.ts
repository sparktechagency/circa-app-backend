import express from 'express';

import { MessageController } from './message.controller';

import { MessageValidation } from './message.validation';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

router.post(
  '/',
  fileUploadHandler(),
  auth(),
  validateRequest(MessageValidation.createMessageZodSchema),
  MessageController.sendMessage
);

router.post("/purchase/:id",auth(),MessageController.buyMessage)
router.get(
  '/:id',
  auth(),
  MessageController.getMessage
);

export const MessageRoutes = router;
