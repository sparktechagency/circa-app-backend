import { JwtPayload } from 'jsonwebtoken';
import { IComment, ILike, IPost, PostModel } from './post.interface';
import { Comment, Like, Post } from './post.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { USER_ROLES } from '../../../enums/user';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { timeAgo } from '../../../helpers/timeAgo';
import { PostHelper } from './post.helper';
import { Subscription } from '../subscription/subscription.model';
import { POST_VISIBILITY, WHO_CAN_SEE_STATUS } from '../../../enums/post';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { CreditWallet } from '../wallet/wallet.model';
import { Transaction } from '../transaction/transaction.model';
import { Block, User } from '../user/user.model';
import AggregateQueryBuilder from '../../builder/AggrigateQueryBuilder';
import mongoose from 'mongoose';

const createPostIntoDB = async (payload: IPost) => {
  console.log(payload);
  
  if ((payload as any).schedule_post=='true') {
    payload.status = 'draft';
    payload.scdule_date = new Date(
      `${payload.scdule_date} ${payload.schedule_time}`,
    );
  }
  const post = await Post.create(payload);
  await RedisHelper.keyDelete(`myPosts:${post?.user}:*`);
  if (payload.schedule_post) {
    return post;
  }
  await kafkaProducer.sendMessage('utils', {
    type: 'post-notification',
    data: post._id,
  });
  await kafkaProducer.sendMessage('post', {
    type: 'save-cache',
    data: post._id,
  });
  return post;
};

const getMyPosts = async (user: JwtPayload, query: Record<string, any>) => {
  const cache = await RedisHelper.redisGet(`myPosts:${user.id}`, query);
  if (cache) return cache;
  const initQuery = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(
    user.role,
  )
    ? { status: 'active' }
    : { user: user.id, status: { $in: ['active', 'draft'] } };
  const postQuery = new QueryBuilder(Post.find(initQuery), query)
    .paginate()
    .sort()
    .filter()
    .search(['title', 'description']);
  let [posts, pagination] = await Promise.all([
    postQuery.modelQuery.populate('user', ['name', 'email', 'image']).exec(),
    postQuery.getPaginationInfo(),
  ]);
  posts = posts.map((post: any) => {
    return {
      ...post.toJSON(),
      timeAgo: timeAgo(post.createdAt),
    };
  });
  await RedisHelper.redisSet(
    `myPosts:${user.id}`,
    { posts, pagination },
    query,
    240,
  );
  return { posts, pagination };
};

const getPostDetails = async (id: string, user: JwtPayload) => {
  const cache = await RedisHelper.redisGet(`postDetails:${user.id}:${id}`);
  if (cache) return cache;
  const post: any = await Post.findById(id)
    .populate('user', ['name', 'email', 'image'])
    .lean()
    .exec();
  if (!post) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  if (post.status === 'delete')
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  if (post.user._id !== user.id) {
    const isMember = await Subscription.findOne({
      user: user.id,
      creator: post.user._id,
      status: 'active',
    }).exec();
    if (!isMember) {
      const purchasedPost = await Transaction.findOne({
        user: user.id,
        post: post._id,
      }).exec();
      const newPost = {
        ...post,
        timeAgo: timeAgo(post.createdAt),
        ...(!purchasedPost && { premium_status: 'Not a Premium User' }),
        isLike: (await Like.findOne({
          user: user.id,
          post: post._id,
        }))
          ? true
          : false,
        like_count: post.post_visibility?.includes(POST_VISIBILITY.HIDE_LIKES)
          ? 0
          : post.like_count,
        comment_count: post.post_visibility?.includes(
          POST_VISIBILITY.HIDE_COMMENTS,
        )
          ? 0
          : post.comment_count,
      };
      await RedisHelper.redisSet(
        `postDetails:${user.id}:${id}`,
        newPost,
        {},
        240,
      );
      return newPost;
    }
    const newPost = {
      ...post,
      timeAgo: timeAgo(post.createdAt),
      isLike: await Like.findOne({
        user: user.id,
        post: post._id,
      }),
      like_count: post.post_visibility?.includes(POST_VISIBILITY.HIDE_LIKES)
        ? 0
        : post.like_count,
      comment_count: post.post_visibility?.includes(
        POST_VISIBILITY.HIDE_COMMENTS,
      )
        ? 0
        : post.comment_count,
    };
    await RedisHelper.redisSet(
      `postDetails:${user.id}:${id}`,
      newPost,
      {},
      240,
    );
    return newPost;
  }
  await RedisHelper.redisSet(
    `postDetails:${user.id}:${id}`,
    {
      ...post,
      timeAgo: timeAgo(post.createdAt),
      isLike: (await Like.findOne({ user: user.id, post: post._id }))
        ? true
        : false,
      like_count: post.post_visibility?.includes(POST_VISIBILITY.HIDE_LIKES)
        ? 0
        : post.like_count,
      comment_count: post.post_visibility?.includes(
        POST_VISIBILITY.HIDE_COMMENTS,
      )
        ? 0
        : post.comment_count,
    },
    {},
    240,
  );
  return {
    ...post,
    timeAgo: timeAgo(post.createdAt),
    isLike: (await Like.findOne({ user: user.id, post: post._id }))
      ? true
      : false,
    like_count: post.post_visibility?.includes(POST_VISIBILITY.HIDE_LIKES)
      ? 0
      : post.like_count,
    comment_count: post.post_visibility?.includes(POST_VISIBILITY.HIDE_COMMENTS)
      ? 0
      : post.comment_count,
  };
};

const updatePostToDB = async (id: string, payload: Partial<PostModel>) => {
  const post = await Post.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  await RedisHelper.keyDelete(`postDetails:${post?.user}:${id}:*`);
  await RedisHelper.keyDelete(`myPosts:${post?.user}:*`);
  return post;
};

const deletePostToDB = async (id: string) => {
  const post = await Post.findOneAndUpdate(
    { _id: id },
    { status: 'delete' },
    { new: true },
  );
  return post;
};

const getPostsFromFeedToUser = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const cache = await RedisHelper.redisGet(`postFeed:${user.id}`, query);
  if (cache) return cache;
  const cachePosts = await PostHelper.getCachePosts(user);
  const blockLists = await Block.find({ blocked_by: user.id }).distinct('user');

  // const subscribeCreators = await Subscription.find({user:user.id,status:"active"}).distinct('creator')

  const initQuery = {
    $or: [
      // {
      //     user:{$in:subscribeCreators},
      // },
      {
        _id: { $in: cachePosts },
      },
      {
        who_can_see: {$in: [WHO_CAN_SEE_STATUS.EVERYONE, WHO_CAN_SEE_STATUS.GOLD_TIERS, WHO_CAN_SEE_STATUS.SUBSCRIBER]},
      },
    ],
    post_visibility: {
      $nin: [POST_VISIBILITY.ONLY_ME],
    },
    user: { $nin: blockLists },
    status: 'active',
  };

  const postQuery = new QueryBuilder(Post.find(initQuery), query)
    .paginate()
    .sort()
    .filter()
    .search(['title', 'description']);
  let [posts, pagination] = await Promise.all([
    postQuery.modelQuery.populate('user', ['name', 'email', 'image']).exec(),
    postQuery.getPaginationInfo(),
  ]);
  posts = await Promise.all(
    posts.map(async (post: any) => {
      const isLiked = await Like.findOne({
        user: user.id,
        post: post._id,
      })
        .lean()
        .exec();
      return {
        ...post.toJSON(),
        timeAgo: timeAgo(post.createdAt),
        isLiked: isLiked ? true : false,
        likeCount: post.post_visibility?.includes(POST_VISIBILITY.HIDE_LIKES)
          ? 0
          : post?.like_count,
        comment_count: post?.post_visibility?.includes(
          POST_VISIBILITY.HIDE_COMMENTS,
        )
          ? 0
          : post?.comment_count,
        isPrimium: post.who_can_see !== WHO_CAN_SEE_STATUS.EVERYONE,
      };
    }),
  );
  await RedisHelper.redisSet(
    `postFeed:${user.id}`,
    { posts, pagination },
    query,
    240,
  );
  return { posts, pagination };
};

const seePostByCredits = async (user: JwtPayload, postId: string) => {
  const post = await Post.findById(postId)
    .populate('user', ['name', 'email', 'image'])
    .lean()
    .exec();
  if (!post) throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  if (post.status === 'delete')
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');

  const wallet = await CreditWallet.findOne({ user: user.id }).exec();

  if (!wallet)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "You don't have enough credits to see this post",
    );

  if (wallet.credit < 10)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "You don't have enough credits to see this post",
    );
  await kafkaProducer.sendMessage('post', {
    type: 'purchase-post',
    data: { user: user.id, post: post._id },
  });
  return post;
};

const likePostIntoDB = async (payload: ILike) => {
  const exist = await Like.findOne({
    user: payload.user,
    $or: [{ post: payload.post }, { comment: payload.comment }],
  }).exec();
  if (exist) {
    await Like.findOneAndDelete({
      user: payload.user,
      $or: [{ post: payload.post }, { comment: payload.comment }],
    });
    if (payload.for == 'post')
      await Post.findByIdAndUpdate(exist.post, {
        $inc: { like_count: -1 },
      }).exec();
    if (payload.for == 'comment')
      await Comment.findByIdAndUpdate(exist.comment, {
        $inc: { like_count: -1 },
      }).exec();
    return { message: 'Like removed' };
  }
  const like = await Like.create(payload);
  const user = await User.findById(like.user).lean().exec();
  let post = await Post.findById(like.post).lean().exec();

  if (!post) {
    post = (await Comment.findById(like.comment).populate('post').lean().exec())
      ?.post as any;
  }

  if (payload.for == 'post')
    await Post.findByIdAndUpdate(post?._id, { $inc: { like_count: 1 } }).exec();
  if (payload.for == 'comment')
    await Comment.findByIdAndUpdate(like.comment, {
      $inc: { like_count: 1 },
    }).exec();
  if (payload.for == 'post') {
    await Promise.all([
      RedisHelper.keyDelete(`postDetails:*`),
      RedisHelper.keyDelete(`myPosts:${post?.user}:*`),
      RedisHelper.keyDelete(`postFeed:*`),
    ]);
  }

  await kafkaProducer.sendMessage('utils', {
    type: 'notification',
    data: {
      title: `${(user as any)?.name} has liked your post`,
      message: `${(user as any)?.name} has liked your post`,
      isRead: false,
      filePath: 'post',
      referenceId: like.post,
      receiver: [post?.user],
    },
  });
};

const commentPostIntoDB = async (payload: IComment) => {
  const comment = await Comment.create(payload);
  const user = await User.findById(comment.user).lean().exec();
  const post = await Post.findById(comment.post).lean().exec();
  if (payload.for == 'post')
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { comment_count: 1 },
    }).exec();
  if (payload.for == 'post') {
    await Promise.all([
      RedisHelper.keyDelete(`postDetails:*`),
      RedisHelper.keyDelete(`myPosts:${post?.user}:*`),
      RedisHelper.keyDelete(`postFeed:*`),
    ]);
  }
  await kafkaProducer.sendMessage('utils', {
    type: 'notification',
    data: {
      title: `${(user as any)?.name} has commented on your post`,
      message: `${(user as any)?.name} has commented on your post`,
      isRead: false,
      filePath: 'post',
      referenceId: comment.post,
      receiver: [post?.user],
    },
  });
};

const getLikesByPostId = async (postId: string, query: Record<string, any>) => {
  const likeQuery = new QueryBuilder(Like.find({ post: postId }), query)
    .paginate()
    .sort();
  let [likes, pagination] = await Promise.all([
    likeQuery.modelQuery.populate('user', ['name', 'email', 'image']).exec(),
    likeQuery.getPaginationInfo(),
  ]);
  return { likes: likes.map((like: any) => like.user), pagination };
};

const getCommentsByPostId = async (
  postId: string,
  query: Record<string, any>,
) => {
  const commentQuery = new AggregateQueryBuilder(Comment, query)
    .paginate()
    .sort();
  commentQuery.insertCustomStage([
    {
      $match: {
        post: new mongoose.Types.ObjectId(postId),
        for: 'post',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
        pipeline: [{ $project: { name: 1, email: 1, image: 1 } }],
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'comment',
        as: 'reply',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
              pipeline: [{ $project: { name: 1, email: 1, image: 1 } }],
            },
          },
        ],
      },
    },
  ]);
  const [comments, pagination] = await Promise.all([
    commentQuery.exec(),
    commentQuery.getPaginationInfo(),
  ]);
  return { comments, pagination };
};

export const PostServices = {
  createPostIntoDB,
  getMyPosts,
  getPostDetails,
  updatePostToDB,
  deletePostToDB,
  getPostsFromFeedToUser,
  seePostByCredits,
  likePostIntoDB,
  commentPostIntoDB,
  getLikesByPostId,
  getCommentsByPostId,
};
