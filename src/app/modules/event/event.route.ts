import express from 'express';
import { EventController } from './event.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { EventValidations } from './event.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.route('/')
    .post(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),fileUploadHandler(),validateRequest(EventValidations.createEventZodSchema),EventController.createEvent)
    .get(EventController.getAllEvents)

router.route('/:id')
    .patch(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),fileUploadHandler(),validateRequest(EventValidations.updateEventZodSchema),EventController.updateEvent)
    .delete(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),EventController.deleteEvent)

export const EventRoutes = router;
