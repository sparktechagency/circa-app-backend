import { Types } from "mongoose";
import { Subscription } from "../subscription/subscription.model";
import { IFeatures } from "./plan.interface";
import { FEATURES_LIST_STATUS } from "../../../enums/features";

const isDiscountAvailable =async (user:Types.ObjectId,creator:Types.ObjectId,features:FEATURES_LIST_STATUS,price?:number) => {
    const plan = await Subscription.findOne({ user: user, creator: creator, status: 'active' }).lean()
    if(!plan && !price){
        return 0
    }

    if(!plan){
        return 0
    }

    const isFeaturesExist = plan.features.find((feature) => feature.name == features);

    if(!isFeaturesExist && !price){
        return 0
    }

    if(!isFeaturesExist){
        return 0
    }

    if(isFeaturesExist.discount && price){
        return isFeaturesExist.discount
    }
    return 1


};



export const PlanHelper = {
    isDiscountAvailable
}