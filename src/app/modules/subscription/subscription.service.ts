import { JwtPayload } from 'jsonwebtoken';
import { SubscriptionModel } from './subscription.interface';
import { Plan } from '../plan/plan.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';
import { Subscription } from './subscription.model';

const purchasePlanFromStripe = async (user:JwtPayload,planId:string) => {
    const plan = await Plan.findById(planId);

    if(!plan){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Plan not found');
    }

    if(plan.status !== 'active'){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Plan is not active');
    }

    const exist = await Subscription.findOne({ user: user.id, plan: planId });
    if(exist){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You already have this plan');
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `For purchase ${plan.name} plan \n`,
                        description: plan.subtitle,
                    },
                    unit_amount: (plan.price ||0) * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        metadata: { userId: user.id, planId: planId },
        success_url: 'https://www.example.com/success',
        cancel_url: 'https://www.example.com/cancel',
    })

    if(!session.url){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Something went wrong!");
    }

    return session.url
};


export const SubscriptionServices = { 
    purchasePlanFromStripe
};
