import { JwtPayload } from 'jsonwebtoken';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';
import { Creator, User } from '../user/user.model';
import { IPlan, PlanModel } from './plan.interface';
import { Plan } from './plan.model';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { FEATURES_LIST_STATUS } from '../../../enums/features';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Subscription } from '../subscription/subscription.model';


const createPlanOFUserInDB = async (data: IPlan) => {
      const user = await Creator.findById(data.user);
    const result = await Plan.create(data);
    await RedisHelper.keyDelete(`allPlans:${data.user}:*`);
  
    await Promise.all([
        kafkaProducer.sendMessage('utils', {
            type: 'notification',
            data: {
                title: `You have created a new plan!`,
                message: `You have created a new plan!`,
                isRead: false,
                filePath: 'plan',
                referenceId: result._id,
                receiver: [user?._id],
            } as INotification,
        }),

        kafkaProducer.sendMessage('utils', {
            type: 'notification',
            data: {
                title: `${user?.name} has created a new plan!`,
                message: `${user?.name} has created a new plan!`,
                isRead: false,
                filePath: 'plan',
                referenceId: result._id,
            } as INotification,
        }),

    ])
    return result;
}


const getAllPlans = async (user:JwtPayload,userId?:string) => {
    const cache = await RedisHelper.redisGet(`allPlans:${user.id}:${userId}`);
    if (cache) return cache;
    let result = await Plan.find({ status: 'active', user: user.id }).sort({ createdAt: -1 }).lean();
    if (userId) {
        result = await Promise.all(
            result.map(async (plan) => {
                const isSubscribed = await Subscription.findOne({
                    user:userId,
                    status: 'active',
                    plan: plan._id,
                })
                return {
                    ...plan,
                    isSubscribed: isSubscribed ? true : false,
                }
            })
        )
    }
    await RedisHelper.redisSet(`allPlans:${user.id}:${userId}`, result, {}, 240);
    return result;
}


const updatePlansIntoDb = async (id: string, data: Partial<IPlan>) => {
    const result = await Plan.findOneAndUpdate({ status: 'active', _id: id }, data, { new: true });
    await RedisHelper.keyDelete(`allPlans:${result?.user}:*`);
    return result;
}


const deletePlanFromDB = async (id: string) => {
    const result = await Plan.findOneAndUpdate({ status: 'active', _id: id }, { status: 'inactive' }, { new: true });
    await RedisHelper.keyDelete(`allPlans:${result?.user}:*`);
    return result;
}

const getFeaturesList = async () => {
    return Object.values(FEATURES_LIST_STATUS)
}


export const PlanServices = {
    createPlanOFUserInDB,
    getAllPlans,
    updatePlansIntoDb,
    deletePlanFromDB,
    getFeaturesList
};
