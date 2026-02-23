import express from 'express';
import { TransactionController } from './transaction.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.route('/').get(auth(),TransactionController.getTransactions);

export const TransactionRoutes = router;
