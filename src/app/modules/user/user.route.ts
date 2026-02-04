import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
const router = express.Router();

router
  .route('/profile')
  .get(auth(USER_ROLES.ADMIN, USER_ROLES.FAN, USER_ROLES.CREATOR), UserController.getUserProfile)
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.FAN, USER_ROLES.CREATOR),
    fileUploadHandler(),
    (req: Request, res: Response, next: NextFunction) => {
      if (req.body.data) {
        req.body = UserValidation.updateUserZodSchema.parse(
          JSON.parse(req.body.data)
        );
      }
      return UserController.updateProfile(req, res, next);
    }
  );

router
  .route('/')
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser
  );

router
  .route('/apply-for-creator')
  .post(
    auth(USER_ROLES.FAN),
    fileUploadHandler(),
    validateRequest(UserValidation.applyForBeACreatorZodSchema),
    UserController.applyForBeACreator
  );

router
  .route('/creator-requests')
  .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), UserController.getALlCreatorRequests);

router
  .route('/creator-requests/:id')
  .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),validateRequest(UserValidation.changeStatusOfCreatorRequestZodSchema) ,UserController.changeStatusOfCreatorRequest);

router
  .route('/creator')
  .get(auth(USER_ROLES.FAN), UserController.getCreatorList);
router.route("/my-creator").get(auth(USER_ROLES.FAN), UserController.getMyCreatorList);
router.get("/friend-flirty", auth(USER_ROLES.FAN),validateRequest(UserValidation.getFriendsAndFlattersListZodSchema),UserController.getFriendsAndFlattersList);

router.route("/block")
    .post(auth(),validateRequest(UserValidation.blockUserZodSchema),UserController.blockUser)
    .get(auth(),UserController.getBlockList)

router.route("/report")
    .post(auth(),validateRequest(UserValidation.reportUserZodSchema),UserController.reportUser)
    .get(auth(USER_ROLES.ADMIN,USER_ROLES.SUPER_ADMIN),UserController.getReportList)




router.route("/creator/:id").get(auth(USER_ROLES.FAN), UserController.getCreatorProfile);


router.route('/upload-file').post(fileUploadHandler(), UserController.uploadFile);
export const UserRoutes = router;
