import { Types } from 'mongoose';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { FavoriteModel, IFavorite } from './favorite.interface';
import { Favorite } from './favorite.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { JwtPayload } from 'jsonwebtoken';
import { RedisHelper } from '../../../tools/redis/redis.helper';

const makeFavorite = async (user: string, creator: string): Promise<any> => {
  const isFavorite = await Favorite.findOne({ user, creator });
  if (isFavorite) {
    await RedisHelper.keyDelete(`myFavorites:${user}:*`);
    await RedisHelper.keyDelete(`friendsAndFlatters:${user}:*`);
    return await Favorite.findOneAndDelete({ user, creator });
  }
  const favorite = await Favorite.create({ user, creator });
  if (!favorite) {
    return null;
  }
  const favoriteItem = await Favorite.findOne({ user, creator })
    .populate('user', 'name email image')
    .populate('creator', 'name email image')
    .exec();
  await Promise.all([
    RedisHelper.keyDelete(`myFavorites:${user}:*`),
    RedisHelper.keyDelete(`friendsAndFlatters:${user}:*`),
    kafkaProducer.sendMessage('utils', {
      type: 'notification',
      data: {
        title: `${(favoriteItem?.user as any)?.name} added you to their favorite list`,
        message: `${(favoriteItem?.user as any)?.name} added you to their favorite list`,
        isRead: false,
        filePath: 'favorite',
        receiver: [favorite?.creator],
        referenceId: favorite?._id,
      },
    }),
  ]);

  return favorite;
};

const favoriteListOfUser = async (
  user: JwtPayload,
  query: Record<string, any>,
): Promise<any> => {
  const cache = await RedisHelper.redisGet(`myFavorites:${user.id}`, query);
  if (cache) return cache;
  const favoriteQuery = new QueryBuilder(
    Favorite.find({ user: user.id }),
    query,
  )
    .paginate()
    .sort()
    .filter();
  let [favorites, pagination] = await Promise.all([
    favoriteQuery.modelQuery
      .populate('creator', 'name email image short_bio date_of_birth age')
      .lean()
      .exec(),
    favoriteQuery.getPaginationInfo(),
  ]);
  favorites = favorites.map((favorite: any) => favorite.creator);
  await RedisHelper.redisSet(
    `myFavorites:${user.id}`,
    { favorites, pagination },
    query,
    240,
  );
  return { favorites, pagination };
};

export const FavoriteServices = {
  makeFavorite,
  favoriteListOfUser,
};
