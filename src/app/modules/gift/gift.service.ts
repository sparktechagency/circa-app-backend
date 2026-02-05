import { JwtPayload } from 'jsonwebtoken';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import QueryBuilder from '../../builder/QueryBuilder';
import { GiftModel, IGift, ISendGiftPayload } from './gift.interface';
import { Gift } from './gift.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Event } from '../event/event.model';
import { CreditWallet } from '../wallet/wallet.model';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';

const createGiftIntoDb = async (gift: IGift): Promise<IGift> => {
    const result = await Gift.create(gift);
    await RedisHelper.keyDelete('gifts:*');
    return result;
};


const getGiftsFromDB = async (query: Record<string, any>) => {
    const cache = await RedisHelper.redisGet('gifts', query);
    if (cache) return cache;
    const giftQuery = new QueryBuilder(Gift.find({ status: 'active' }), query).paginate().sort();
    const [gifts, pagination] = await Promise.all([
        giftQuery.modelQuery.exec(),
        giftQuery.getPaginationInfo(),
    ]);

    await RedisHelper.redisSet('gifts', { gifts, pagination }, query, 60*60);

    return { gifts, pagination };
};

const updateGiftIntoDb = async (id: string, data: Partial<IGift>): Promise<IGift | null> => {
    const result = await Gift.findOneAndUpdate({ status: 'active', _id: id }, data, { new: true });
    await RedisHelper.keyDelete('gifts:*');
    return result;
};

const deleteGiftFromDB = async (id: string): Promise<IGift | null> => {
    const result = await Gift.findOneAndUpdate({ status: 'active', _id: id }, { status: 'delete' }, { new: true });
    await RedisHelper.keyDelete('gifts:*');
    return result;
};

const sendGiftToCreators = async (user:JwtPayload,giftDetails:ISendGiftPayload)=>{
    const gift = await Gift.findById(giftDetails.gift);
    if(!gift){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Gift not found');
    }

    if(gift.status === 'delete'){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Gift not found');
    }

    if(giftDetails.event){
        const event = await Event.findById(giftDetails.event);
        if(!event){
            throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
        }
        if(event.status === 'delete'){
            throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
        }

        if(event?.end_date){
            if(event.end_date < new Date()){
                throw new ApiError(StatusCodes.NOT_FOUND, 'Event is already ended');
            }
        }
    }

    const total = giftDetails.receivers.length * gift.credit

    const creditWallet = await CreditWallet.findOne({user:user.id}).exec();

    if(!creditWallet || creditWallet.credit < total){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You don\'t have enough credits');
    }

    await kafkaProducer.sendMessage("chat",{
        type:"send-gift",
        data:{gift:giftDetails,user:user.id}
    })

    return gift

}


export const GiftServices = {
    createGiftIntoDb,
    getGiftsFromDB,
    updateGiftIntoDb,
    deleteGiftFromDB,
    sendGiftToCreators
};
