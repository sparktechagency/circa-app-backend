import express from 'express';
import { WalletController } from './wallet.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { WalletValidations } from './wallet.validation';

const router = express.Router();

router.route("/")
    .get(auth(),WalletController.getWallet)

router.route("/withdraw")
    .post(auth(USER_ROLES.CREATOR),validateRequest(WalletValidations.withdrawMoneyZodSchema),WalletController.withdrawMoney)

export const WalletRoutes = router;
