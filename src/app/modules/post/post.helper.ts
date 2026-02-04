import { JwtPayload } from 'jsonwebtoken';
import { POST_VISIBILITY, WHO_CAN_SEE_STATUS } from '../../../enums/post';
import { USER_ROLES } from '../../../enums/user';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { Subscription } from '../subscription/subscription.model';
import { Block, User } from '../user/user.model';
import { Post } from './post.model';

async function saveCache(userId:string,postId:string,creatorId?:string) {
    const isOnBlockList = await Block.findOne({ $or:[{blocked_by:userId,user:creatorId},{blocked_by:creatorId,user:userId}] });
    if(isOnBlockList) return
    let isCache = await RedisHelper.redisGet(`myPosts:${userId}`);

      if (!isCache?.length) {
        isCache = [];
      }

      isCache.push(postId);
      await RedisHelper.redisSet(`myPosts:${userId}`, isCache, {}, 60*60*24);
      await RedisHelper.keyDelete(`postFeed:${userId}:*`);
}

const savePostIntoSubscribersCache = async (postId: string) => {
  const post = await Post.findById(postId).populate('user').exec();
  const subscribers = await Subscription.find({
    creator: post?.user._id,
    status: 'active',
  }).distinct('user');
  if (!post?.post_visibility.includes(POST_VISIBILITY.ONLY_ME)) {
    await Promise.all(
      subscribers.map(async (subscriber) => {
        await saveCache(subscriber as any,postId)
      })
    )
  }

  if (
    post?.who_can_see == WHO_CAN_SEE_STATUS.EVERYONE &&
    !post?.post_visibility.includes(POST_VISIBILITY.ONLY_ME)
  ) {
    const all_users = await User.find({
      status: 'active',
      verified: true,
      role: {
        $nin: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CREATOR],
        _id: { $nin: subscribers },
      },
    }).distinct('_id');

    await Promise.all(
      all_users.map(async (user) => {
        await saveCache(user as any,postId)
      })
    )
  }
};

const getCachePosts = async (user: JwtPayload) => {
    const cache = await RedisHelper.redisGet(`myPosts:${user.id}`);
    if(!cache) return []

    return cache
}

export const PostHelper = {
  savePostIntoSubscribersCache,
  getCachePosts
};
