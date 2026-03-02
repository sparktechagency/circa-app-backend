import { FavoriteServices } from "../../../app/modules/favorite/favorite.service";
import { UserHelper } from "../../../app/modules/user/user.helper";
import { UserService } from "../../../app/modules/user/user.service";
import { handleAccountUpdatedEvent } from "../../../handlers/handleAccountUpdatedEvent";
import { handleCreditPurchase } from "../../../handlers/handleCreditPurchase";
import { handleSubscriptionPurchase } from "../../../handlers/handleSubscriptionPurchase";
import { handleUserWithdraw } from "../../../handlers/handleUserWithdraw";
import { kafkaConsumer } from "../kafka-producers/kafka.consumer"

export const userConsumer = async ()=>{
    await kafkaConsumer({groupId:"circa-user",topic:"circa-user",cb:async (data:{type:string,data:any})=>{
       try {
 
        
        switch (data.type) {
            case "approve-request":
                await UserHelper.acceptTheCreatorRequest(data.data);
                break;
            case "purchase-credit":
                await handleCreditPurchase(data.data);
                break;
            case "plan-upgrade":
                await handleSubscriptionPurchase(data.data);
                break;
            case "make-favorite":
                await FavoriteServices.makeFavorite(data.data?.user, data.data?.creator);
                break;

            case "block-user":
                await UserService.blockUserIntoDB(data.data.user, data.data.id);
                break;
            case "report-user":
                await UserService.reportUserIntoDB(data.data.user, data.data.id, data.data.reason);
                break;
            case "connect-account":
                await handleAccountUpdatedEvent(data.data);
                break;
            case "withdraw":
                await handleUserWithdraw(data.data?.user, data.data?.amount);
                break;
            default:
                break;
        }
       } catch (error) {
        console.log(error);
        
       }
    }})
}