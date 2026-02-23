import { INotification } from '../app/modules/notification/notification.interface';
import { Post } from '../app/modules/post/post.model';
import { Subscription } from '../app/modules/subscription/subscription.model';
import { kafkaProducer } from '../tools/kafka/kafka-producers/kafka.producer';

const handleSubscriptionExpire = async () => {
  try {
    const expiresSubscriptions = await Subscription.find({
      status: 'active',
      end_date: { $lt: new Date() },
    }).lean();
    for (const subscription of expiresSubscriptions) {
      await kafkaProducer.sendMessage('utils', {
        type: 'notification',
        data: {
          title: 'Your subscription has expired!',
          message: `${subscription?.name} has expired`,
          isRead: false,
          filePath: 'plan',
          referenceId: subscription._id,
          receiver: [subscription.user],
        } as INotification,
      });
    }
    const subscrionIds = expiresSubscriptions.map(
      subscription => subscription._id,
    );
    await Subscription.updateMany(
      { _id: { $in: subscrionIds } },
      { status: 'expire' },
    );
  } catch (error) {
    console.log(error);
  }
};

const handleSchedulePosts = async () => {
  const schedule_posts = await Post.find({
    status: 'draft',
    scdule_date: { $lt: new Date() },
  }).lean();
  for (const post of schedule_posts) {
    await kafkaProducer.sendMessage('utils', {
      type: 'post-notification',
      data: post._id,
    });
    await kafkaProducer.sendMessage('post', {
      type: 'save-cache',
      data: post._id,
    });
  }
  const postIds = schedule_posts.map(post => post._id);
  await Post.updateMany({ _id: { $in: postIds } }, { status: 'active' });
};

export const workerHandlers = {
  handleSubscriptionExpire,
  handleSchedulePosts,
};
