import express from 'express';
import { CallingController } from './calling.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { CallingValidations } from './calling.validation';

const router = express.Router();

router.post("/start-call",auth(USER_ROLES.FAN),validateRequest(CallingValidations.createCallingZodSchema),CallingController.subscribeCallingchannel)

router.patch("/call-status",auth(),validateRequest(CallingValidations.changeCallingStatusZodSchema),CallingController.changeCallingStatus)


export const CallingRoutes = router;
