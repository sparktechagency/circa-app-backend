import { Schema, model } from 'mongoose';
import { IFavorite, FavoriteModel } from './favorite.interface'; 

const favoriteSchema = new Schema<IFavorite, FavoriteModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

favoriteSchema.index({ user: 1, creator: 1 }, { unique: true });


export const Favorite = model<IFavorite, FavoriteModel>('Favorite', favoriteSchema);
