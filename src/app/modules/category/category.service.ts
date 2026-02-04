import { CategoryModel, ICategory } from './category.interface';
import { Category } from './category.model';

const createCategory = async (data: ICategory): Promise<ICategory> => {
    const result = await Category.create(data);
    return result;
};

const getAllCategory = async (query: Record<string, any>): Promise<ICategory[]> => {
    const result = await Category.find({status: "active"}).sort({ createdAt: -1 }).select(!query?.nameOnly ? { name: 1, image: 1 } : { name: 1 });
    return result;
};

const updateCategory = async (id: string, data: ICategory): Promise<ICategory | null> => {
    const result = await Category.findOneAndUpdate({ _id: id }, data, { new: true });
    return result;
};

const deleteCategory = async (id: string): Promise<ICategory | null> => {
    const result = await Category.findOneAndUpdate({ _id: id }, { status: "delete" }, { new: true });
    return result;
};


export const CategoryServices = {
    createCategory,
    getAllCategory,
    updateCategory,
    deleteCategory
};
