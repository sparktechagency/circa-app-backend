import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { DisclaimerRoutes } from '../app/modules/disclaimer/disclaimer.route';
import { PostRoutes } from '../app/modules/post/post.route';
import { ProductRoutes } from '../app/modules/product/product.route';
import { PackageRoutes } from '../app/modules/package/package.route';
import { CartRoutes } from '../app/modules/cart/cart.route';
import { OrderRoutes } from '../app/modules/order/order.route';
import { PlanRoutes } from '../app/modules/plan/plan.route';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route';
import { FavoriteRoutes } from '../app/modules/favorite/favorite.route';
import { ChatRoutes } from '../app/modules/chat/chat.routes';
import { MessageRoutes } from '../app/modules/message/message.routes';
import { GiftRoutes } from '../app/modules/gift/gift.route';
import { EventRoutes } from '../app/modules/event/event.route';
import { DashboardRoutes } from '../app/modules/dashboard/dashboard.route';
import { WalletRoutes } from '../app/modules/wallet/wallet.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { TransactionRoutes } from '../app/modules/transaction/transaction.route';
import { CallingRoutes } from '../app/modules/calling/calling.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/category',
    route: CategoryRoutes,
  },
  {
    path: '/disclaimer',
    route: DisclaimerRoutes,
  },
  {
    path: '/post',
    route: PostRoutes,
  },
  {
    path: '/product',
    route: ProductRoutes,
  },
  {
    path: '/package',
    route: PackageRoutes,
  },
  {
    path:"/cart",
    route: CartRoutes
  },
  {
    path:"/order",
    route: OrderRoutes
  },
  {
    path:"/plan",
    route: PlanRoutes
  },
  {
    path:"/subscription",
    route:SubscriptionRoutes
  },
  {
    path:"/favorite",
    route:FavoriteRoutes
  },
  {
    path:"/chat",
    route:ChatRoutes
  },
  {
    path:"/message",
    route:MessageRoutes
  },
  {
    path:'/gift',
    route:GiftRoutes
  },
  {
    path:"/event",
    route:EventRoutes
  },
  {
    path:"/dashboard",
    route:DashboardRoutes
  },
  {
    path:"/wallet",
    route:WalletRoutes
  },
  {
    path:"/notification",
    route:NotificationRoutes
  },
  {
    path:"/transaction",
    route:TransactionRoutes
  },
  {
    path:"/calling",
    route:CallingRoutes
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
