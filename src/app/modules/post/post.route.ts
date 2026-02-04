import express from 'express';
import { PostController } from './post.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { PostValidations } from './post.validation';

const router = express.Router();

router.route('/')
    .post(auth(USER_ROLES.CREATOR),fileUploadHandler(),validateRequest(PostValidations.createPostZodSchema),PostController.createPost)
    .get(auth(),PostController.getAllPost)

router.route('/user/:id')
    .get(auth(),PostController.getPostsOfCreator)

router.route("/feed")
    .get(auth(),PostController.getPostFeedForUser)

router.route("/see/:id")
    .post(auth(),PostController.seePostByCredits)

router.route("/like/:id")
    .post(auth(),validateRequest(PostValidations.likePostZodSchema),PostController.likePostIntoDB)
    .get(auth(),PostController.getAllLikes)

router.route("/comment/:id")
    .post(auth(),validateRequest(PostValidations.commentPostZodSchema),PostController.commentPostIntoDB)
    .get(auth(),PostController.getAllComments)

router.route('/:id')
    .get(auth(),PostController.getPostDetails)
    .patch(auth(USER_ROLES.CREATOR),fileUploadHandler(),validateRequest(PostValidations.updatePostZodSchema),PostController.updatePost)
    .delete(auth(USER_ROLES.CREATOR),PostController.deletePost)

export const PostRoutes = router;
