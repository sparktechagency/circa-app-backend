import cron from 'node-cron';
import config from '../config';
import { workerHandlers } from '../handlers/workerHandlers';

export const startWorker = async () => {
  if (config.cron_job) {
    cron.schedule('* * * * *', async () => {
    //   await workerHandlers.handleSubscriptionExpire();
    //   await workerHandlers.handleSchedulePosts();
    await Promise.all([workerHandlers.handleSubscriptionExpire(), workerHandlers.handleSchedulePosts()]);
      console.log('Cron job executed');
    });
  }
};
