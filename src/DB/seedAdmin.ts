import { Gift } from '../app/modules/gift/gift.model';
import { Plan } from '../app/modules/plan/plan.model';
import { User } from '../app/modules/user/user.model';
import config from '../config';
import { USER_ROLES } from '../enums/user';
import { logger } from '../shared/logger';

const payload = {
  name: 'Administrator',
  email: config.super_admin.email,
  role: USER_ROLES.SUPER_ADMIN,
  password: config.super_admin.password,
  contact: '1234567890',
  verified: true,
};

export const seedSuperAdmin = async () => {
  const isExistSuperAdmin = await User.findOne({
    email: config.super_admin.email,
    role: USER_ROLES.SUPER_ADMIN,
  });
  if (!isExistSuperAdmin) {
    await User.create(payload);
    logger.info('✨ Super Admin account has been successfully created!');
  }

  const wowExist = await Gift.findOne({ name: 'WOW' });
  if (!wowExist) {
    await Gift.create({ name: 'WOW', credit: 10, status: 'delete',image:'/wow.png' });
    logger.info('✨ WOW gift has been successfully created!');
  }

  const freePlanExist = await Plan.findOne({ fromAdmin: true });

  if(!freePlanExist){
    await Plan.create({
      name: 'Free',
      subtitle: 'Free plan',
      price: 0,
      features: [],
      status: 'active',
      category: 'Free',
      duration: 0,
      emoji: '🎉',
      fromAdmin: true
    })
    logger.info('✨ Free plan has been successfully created!');
  }
};
