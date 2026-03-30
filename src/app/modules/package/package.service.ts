import { JwtPayload } from 'jsonwebtoken';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { IPackage, PackageModel } from './package.interface';
import { Package } from './package.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';

const createPackage = async (data: IPackage) => {
    const result = await Package.create(data);
    await RedisHelper.keyDelete('allPackages:*');
    return result;
};


const getAllPackages = async () => {
    const cache = await RedisHelper.redisGet('allPackages');
    if (cache) return cache;
    const result = await Package.find({ status: 'active' }).sort({ createdAt: -1 });
    await RedisHelper.redisSet('allPackages', result, {}, 240);
    return result;
};

const updatePackage = async (id: string, data: Partial<IPackage>) => {
    const result = await Package.findOneAndUpdate({ status: 'active', _id: id }, data, { new: true });
    await RedisHelper.keyDelete('allPackages:*');
    return result;
};

const deletePackage = async (id: string) => {
    const result = await Package.findOneAndUpdate({ status: 'active', _id: id }, { status: 'delete' }, { new: true });
    await RedisHelper.keyDelete('allPackages:*');
    return result;
};

const purchasePackageForCredit = async (user:JwtPayload,packageId:string) => {
    const packageItem = await Package.findById(packageId)
    if(!packageItem){
        throw new ApiError(StatusCodes.NOT_FOUND, "Package doesn't exist!");
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `For purchase ${packageItem.name} package \n and get ${packageItem.credit} credit`,
                    },
                    unit_amount: (packageItem.price ||0) * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        metadata: { userId: user.id, packageId: packageId },
        success_url: 'https://www.example.com/success',
        cancel_url: 'https://www.example.com/cancel',
        customer_email: user.email
    });

    if(!session.url){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Something went wrong!");
    }

    return session.url
}


export const PackageServices = {
    createPackage,
    getAllPackages,
    updatePackage,
    deletePackage,
    purchasePackageForCredit
};
