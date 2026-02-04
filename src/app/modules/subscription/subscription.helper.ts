import { Plan } from "../plan/plan.model";

const calculateTheTime = async (planId: string) => {
    const plan = await Plan.findById(planId).lean()
    let startDate = new Date();
    let endDate = null

    if(plan?.category =='Free'){
        // 30 days from today
        endDate = new Date(new Date().setDate(startDate.getDate() + 30));
    }
    else if(plan?.category == 'Monthly'){
        endDate = new Date(new Date().setDate(startDate.getDate() + 30));
    }
    else if(plan?.category == 'Yearly'){
        endDate = new Date(new Date().setFullYear(startDate.getFullYear() + 1));
    }
    else{
        startDate.setDate(startDate.getDate() + 30);
        endDate = startDate;
    }
    return { startDate, endDate, plan: plan }
}


export const SubscriptionHelper = {
    calculateTheTime
}