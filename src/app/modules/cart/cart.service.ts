import { JwtPayload } from 'jsonwebtoken';
import { ICart } from './cart.interface';
import { Cart } from './cart.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { CartHelper } from './cart.helper';


const addProductIntoCart = async (data:ICart) => {
    const exist = await Cart.findOne({ user: data.user, product: data.product });
    if (exist) {
        const result = await Cart.findOneAndUpdate({ user: data.user, product: data.product }, { $inc: { quantity: data.quantity } }, { new: true });
        await RedisHelper.keyDelete(`myCart:${data.user}:*`);
        return result;
    }
    const result = await Cart.create(data);
    await RedisHelper.keyDelete(`myCart:${data.user}:*`);
    return result;
};

const increaseOrDecreaseQuantity = async (id: string, amount: number) => {
    const result = await Cart.findOneAndUpdate({ _id: id }, { $inc: { quantity: amount } }, { new: true });
    await RedisHelper.keyDelete(`myCart:${result?.user}:*`);
    return result;
};

const deleteProductFromCart = async (id: string) => {
    const result = await Cart.findOneAndDelete({ _id: id });
    await RedisHelper.keyDelete(`myCart:${result?.user}:*`);
    return result;
};

const getCartOfUser = async (user: JwtPayload) => {
    const cache = await RedisHelper.redisGet(`myCart:${user.id}`,);
    if(cache) return cache
    
    const cartQuery = await Cart.find({ user: user.id },{product:1,quantity:1,unit_price:1,total_price:1}).populate('product', 'name image').exec();
    const price_breakdown = CartHelper.calculateThePrice(cartQuery)

    await RedisHelper.redisSet(`myCart:${user.id}`, { cart: cartQuery, price_breakdown }, {}, 240);
    return { cart: cartQuery, price_breakdown };
}


export const CartServices = {
    addProductIntoCart,
    increaseOrDecreaseQuantity,
    deleteProductFromCart,
    getCartOfUser
};
