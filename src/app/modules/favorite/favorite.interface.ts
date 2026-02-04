import { Model, Types } from 'mongoose';

export type IFavorite = {
  user:Types.ObjectId,
  creator:Types.ObjectId
};

export type FavoriteModel = Model<IFavorite>;
