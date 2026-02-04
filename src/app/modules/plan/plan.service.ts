import { JwtPayload } from 'jsonwebtoken';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';
import { User } from '../user/user.model';
import { IPlan, PlanModel } from './plan.interface';
import { Plan } from './plan.model';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { FEATURES_LIST_STATUS } from '../../../enums/features';


const createPlanOFUserInDB = async (data: IPlan) => {
    const result = await Plan.create(data);
    const user = await User.findById(data.user);
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


const getAllPlans = async (user:JwtPayload) => {
    const cache = await RedisHelper.redisGet(`allPlans:${user.id}`);
    if (cache) return cache;
    const result = await Plan.find({ status: 'active', user: user.id }).sort({ createdAt: -1 });
    await RedisHelper.redisSet(`allPlans:${user.id}`, result, {}, 240);
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
