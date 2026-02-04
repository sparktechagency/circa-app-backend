import express from 'express';
import { ProductController } from './product.controller';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { ProductValidations } from './product.validation';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.route('/')
    .post(auth(USER_ROLES.CREATOR),fileUploadHandler(),validateRequest(ProductValidations.createProductZodSchema),ProductController.createProduct)
    .get(auth(),ProductController.getAllProduct)

router.route('/user/:id')
    .get(auth(),ProductController.getAllProductUsingCreatorId)

router.route('/:id')
    .get(auth(),ProductController.getSingleProduct)
    .patch(auth(USER_ROLES.CREATOR),fileUploadHandler(),validateRequest(ProductValidations.updateProductZodSchema),ProductController.updateProduct)
    .delete(auth(),ProductController.deleteProduct)

export const ProductRoutes = router;
