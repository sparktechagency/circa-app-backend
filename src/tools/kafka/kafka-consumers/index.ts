import { cartConsumer } from './cart.consumer';
import { chatConsumer } from './chat.consumer';
import { notificationConsumer } from './notification.consumer';
import { postConsumer } from './post.consumer';
import { userConsumer } from './user.consumer';

export async function loadConsumer() {
  await Promise.all([
    notificationConsumer(),
    userConsumer(),
    cartConsumer(),
    postConsumer(),
    chatConsumer(),
  ]);
  console.log('consumer loaded');
}
