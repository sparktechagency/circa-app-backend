import express from 'express';
import { FavoriteController } from './favorite.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.route('/:id')
    .post(auth(), FavoriteController.makeFavorite)

router.route('/')
    .get(auth(), FavoriteController.getFavorites)

export const FavoriteRoutes = router;
