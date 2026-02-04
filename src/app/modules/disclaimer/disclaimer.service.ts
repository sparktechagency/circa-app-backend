import ApiError from '../../../errors/ApiError';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { IDisclaimer } from './disclaimer.interface';
import { Disclaimer } from './disclaimer.model';
import { StatusCodes } from 'http-status-codes';

const createDisclaimerToDB = async (payload: Partial<IDisclaimer>) => {
  const createDisclaimer = await Disclaimer.findOne({ type: payload.type });

  if (createDisclaimer) {
     await Disclaimer.findOneAndUpdate(
      { type: payload.type },
      { content: payload.content },
      { new: true },
    );
     await RedisHelper.keyDelete(`disclaimer:${payload.type}:*`)
    return payload.content
  }
  await Disclaimer.create(payload);
  await RedisHelper.keyDelete(`disclaimer:${payload.type}:*`)
  return payload.content
};

const getDisclaimerToDB = async (type: string) => {
    const cache = await RedisHelper.redisGet(`disclaimer:${type}`)
    if(cache) return cache
  const disclaimer = await Disclaimer.findOne({ type }, { content: 1 }).exec();
  if (!disclaimer) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Disclaimer not found');
  }
  await RedisHelper.redisSet(`disclaimer:${type}`,disclaimer.content,{},240)
  return disclaimer.content;
};

export const DisclaimerService = {
  createDisclaimerToDB,
  getDisclaimerToDB,
};
