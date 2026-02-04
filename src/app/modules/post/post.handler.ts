import kafka from '../../../config/kafka';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { INotification } from '../notification/notification.interface';
import { Post } from './post.model';

const notifiyAllUsers = async (postId: string) => {
  try {
    RedisHelper.adminKeyDelete(`myPosts`);
    const post = await Post.findById(postId).populate('user').exec();
    await kafkaProducer.sendMessage('utils', {
      type: 'notification',
      data: {
        title: `Your post has been published!`,
        message: `Your post has been published!`,
        isRead: false,
        filePath: 'post',
        referenceId: post?._id,
        receiver: [post?.user._id],
      } as INotification,
    });

    await kafkaProducer.sendMessage('utils', {
      type: 'notification',
      data: {
        title: `${(post?.user as any).name} has published a post!`,
        message: `${(post?.user as any).name} has published a post!`,
        isRead: false,
        filePath: 'post',
        referenceId: post?._id,
      } as INotification,
    });
  } catch (error) {
    console.log(error);
  }
};

export const PostHandler = {
  notifiyAllUsers,
};
