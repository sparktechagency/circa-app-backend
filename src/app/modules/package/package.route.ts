import express from 'express';
import { PackageController } from './package.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { PackageValidations } from './package.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(PackageValidations.createPackageZodSchema),
    PackageController.createPackage,
  )
  .get(auth(), PackageController.getAllPackages);

router
  .route('/purchase/:id')
  .post(auth(USER_ROLES.FAN), PackageController.purchasePackageForCredit);
router
  .route('/:id')
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(PackageValidations.updatePackageZodSchema),
    PackageController.updatePackage,
  )
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PackageController.deletePackage,
  );

export const PackageRoutes = router;
