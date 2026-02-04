import express from 'express';

import { ChatController } from './chat.controller';

import auth from '../../middlewares/auth';
const router = express.Router();

router.post(
  '/:id',
  auth(),
  ChatController.createChat
);
router.get(
  '/',
  auth(),
  ChatController.getChat
);

router.get(
  '/:id',
  auth(),
  ChatController.singleChatDetails
)
export const ChatRoutes = router;
