import { query } from 'express';
import { IProduct, ProductModel } from './product.interface';
import { Product } from './product.model';
import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import unlinkFile from '../../../shared/unlinkFile';
import { RedisHelper } from '../../../tools/redis/redis.helper';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';

const createProduct = async (data: IProduct) => {
  const result = await Product.create(data);
  await RedisHelper.keyDelete(`myProducts:${data.author}:*`);
  await kafkaProducer.sendMessage('utils', {
    type: 'notification',
    data: {
      title: `You have created a new product!`,
      message: `You have created a new product!`,
      isRead: false,
      filePath: 'product',
      referenceId: result._id,
      receiver: [data.author],
    } as INotification,
  });
  return result;
};

const getAllProducts = async (query: Record<string, any>, user: JwtPayload) => {
  const cache = await RedisHelper.redisGet(`myProducts:${user.id}`, query);
  if (cache) return cache;
  const ProductQuery = new QueryBuilder(
    Product.find({ status: 'active', author: user.id }),
    query,
  )
    .paginate()
    .sort()
    .filter()
    .search(['name', 'description']);
  const [products, pagination] = await Promise.all([
    ProductQuery.modelQuery.exec(),
    ProductQuery.getPaginationInfo(),
  ]);
  await RedisHelper.redisSet(
    `myProducts:${user.id}`,
    { products, pagination },
    query,
    240,
  );
  return { products, pagination };
};

const getSingleProduct = async (id: string) => {
  const cache = await RedisHelper.redisGet(`singleProduct:${id}`);
  if (cache) return cache;
  const result = await Product.findOne({ status: 'active', _id: id })
    .populate('author', 'name email image')
    .exec();
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!');
  await RedisHelper.redisSet(`singleProduct:${id}`, result, {}, 240);
  return result;
};

const updateProduct = async (id: string, data: Partial<IProduct>) => {
  const product = await Product.findOne({ status: 'active', _id: id });
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found!');
  if (data.image && product.image) {
    unlinkFile(product.image);
  }
  const result = await Product.findOneAndUpdate(
    { status: 'active', _id: id },
    data,
    { new: true },
  );
  await RedisHelper.keyDelete(`myProducts:${product.author}:*`);
  return result;
};

const deleteProduct = async (id: string) => {
  const result = await Product.findOneAndUpdate(
    { status: 'active', _id: id },
    { status: 'delete' },
    { new: true },
  );
  await RedisHelper.keyDelete(`myProducts:${result?.author}:*`);
  return result;
};

export const ProductServices = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
