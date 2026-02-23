import { JwtPayload } from 'jsonwebtoken';
import { Transaction } from '../transaction/transaction.model';
import {
  TRANSACTION_CATEGORY,
  TRANSACTION_TYPE,
} from '../../../enums/transaction';
import { Types } from 'mongoose';
import { DashboardHelper } from './dashboard.helper';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { Subscription } from '../subscription/subscription.model';

const getCreatorAnalatics = async (
  user: JwtPayload,
  type: 'week' | 'month' = 'week',
  category:TRANSACTION_CATEGORY=TRANSACTION_CATEGORY.MEMBERSHIP
) => {
    const cache = await RedisHelper.redisGet(`creatorAnalytics:${user.id}:${type}:${category}`);
    if (cache) return cache;
  const dateRange = DashboardHelper.getCurrentDateRange(type);
  const membershipTransactons = await Transaction.aggregate([
    {
      $match: {
        creator: new Types.ObjectId(user.id),
        type: TRANSACTION_TYPE.DEBIT,
        category: category,
        createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
      },
    },
    {
      $group: {
        _id: {
          ...(type == 'week'
            ? { $dateToString: { format: '%d', date: '$createdAt' } }
            : { $dateToString: { format: '%m', date: '$createdAt' } }),
        },
        total: [TRANSACTION_CATEGORY.MEMBERSHIP,TRANSACTION_CATEGORY.SHOP].includes(category)?{ $sum: '$payment_received' }:{ $sum: '$credit_received' },
      },
    },
  ]);
  if (type == 'week') {
    const dates = dateRange.dates.map(item => {
      const items = membershipTransactons.find(i => i._id == item);
      return {
        date: String(item),
        total: items?.total || 0,
      };
    });
    await RedisHelper.redisSet(`creatorAnalytics:${user.id}:${type}:${category}`, dates, {}, 240);
    return dates;
  }
  const months = {
    1: 'Jan',
    2: 'Feb',
    3: 'Mar',
    4: 'Apr',
    5: 'May',
    6: 'Jun',
    7: 'Jul',
    8: 'Aug',
    9: 'Sep',
    10: 'Oct',
    11: 'Nov',
    12: 'Dec',
  };
//   console.log(membershipTransactons);
  
  const monthsData = []
  for(let i=1;i<=12;i++){
    const items = membershipTransactons.find(ik => ik._id == i);
    
    monthsData.push({
      date: months[Number(i) as keyof typeof months],
      total: Number(items?.total?.toFixed(2)) || 0,
    });
  }
  await RedisHelper.redisSet(`creatorAnalytics:${user.id}:${type}:${category}`, monthsData, {}, 240);
  return monthsData;
};

const getCreatorAnalaticsSummary = async (id: string) => {
    const cache = await RedisHelper.redisGet(`creatorAnalyticsSummary:${id}`);
    if (cache) return cache;
  const totalSale = await Transaction.aggregate([
    {
      $match: {
        creator: new Types.ObjectId(id),
        type: TRANSACTION_TYPE.DEBIT,
        category: TRANSACTION_CATEGORY.SHOP,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$payment_received' },
      },
    },
  ])
  const totalEarning = await Transaction.aggregate([
    {
      $match: {
        creator: new Types.ObjectId(id),
        type: TRANSACTION_TYPE.DEBIT,
        category: { $in: [TRANSACTION_CATEGORY.MEMBERSHIP, TRANSACTION_CATEGORY.SHOP] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$payment_received' },
      },
    },
  ])

  const totalMembers = await Subscription.aggregate([
    {
      $match: {
        creator: new Types.ObjectId(id),
        status: 'active',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
      },
    },
  ])

  const data=  {
    totalSale: totalSale[0]?.total || 0,
    totalEarning: totalEarning[0]?.total || 0,
    totalMembers: totalMembers[0]?.total || 0,
  }
  await RedisHelper.redisSet(`creatorAnalyticsSummary:${id}`, data, {}, 240);
  return data;

}

export const DashboardServices = {
  getCreatorAnalatics,
  getCreatorAnalaticsSummary
};
