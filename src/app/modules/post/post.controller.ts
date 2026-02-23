import { Request, Response, NextFunction } from 'express';
import { PostServices } from './post.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { ILike } from './post.interface';

const createPost = catchAsync(async (req: Request, res: Response) => {
        const { ...post } = req.body;
        const images = getSingleFilePath(req.files, 'image');
        post.images = images
        post.user = req.user.id
        const result = await PostServices.createPostIntoDB(post);
        sendResponse(res, {
            success: true,
            statusCode: StatusCodes.OK,
            message: 'Post created successfully',
            data: result,
        });
    });

const getAllPost = catchAsync(async (req: Request, res: Response) => {
    const result = await PostServices.getMyPosts(req.user, req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Post data retrieved successfully',
        data: result.posts,
        pagination: result.pagination
    })
})


const getPostsOfCreator = catchAsync(async (req: Request, res: Response) => {
    const result = await PostServices.getMyPosts({id: req.params.id}, req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Post data retrieved successfully',
        data: result.posts,
        pagination: result.pagination
    })
})

const updatePost = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.images = image
    data.user = req.user.id
    if(data.schedule_post=="true"){
        data.schedule_post = true
        data.scdule_date = new Date(`${data.scdule_date} ${data.schedule_time}`)
    }
    
    const result = await PostServices.updatePostToDB(id, data);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Post updated successfully',
        data: result,
    });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PostServices.deletePostToDB(id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Post deleted successfully',
        data: result,
    });
});


const getPostDetails = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PostServices.getPostDetails(id, req.user);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Post data retrieved successfully',
        data: result,
    });
});

const getPostFeedForUser = catchAsync(async (req: Request, res: Response) => {
    const result = await PostServices.getPostsFromFeedToUser(req.user, req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Post data retrieved successfully',
        data: result.posts,
        pagination: result.pagination
    });
});


const seePostByCredits = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PostServices.seePostByCredits(req.user, id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Post data retrieved successfully',
        data: result,
    });
});


const likePostIntoDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await kafkaProducer.sendMessage("post-circa", {type:"like-post",data:{
        user: req.user.id,
        ...(req.body?.type =="post"?{post: id}:{comment: id}),
        for: req.body?.type
    } });
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Like toggle successfully',
    });
});

const commentPostIntoDB = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const comment = {
        ...req.body,
        user: req.user.id,
        ...(req.body?.type =="post"?{post: id}:{comment: id}),
        for: req.body?.type
    }
    const result = await PostServices.commentPostIntoDB(comment);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Comment added successfully',
        data: result
    });
});


const getAllLikes = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PostServices.getLikesByPostId(id,req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Likes data retrieved successfully',
        data: result.likes,
        pagination: result.pagination
    });
});

const getAllComments = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PostServices.getCommentsByPostId(id,req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Comments data retrieved successfully',
        data: result.comments,
        pagination: result.pagination
    });
});

export const PostController = {
    createPost,
    getAllPost,
    updatePost,
    deletePost,
    getPostDetails,
    getPostsOfCreator,
    getPostFeedForUser,
    seePostByCredits,
    likePostIntoDB,
    commentPostIntoDB,
    getAllLikes,
    getAllComments
};
