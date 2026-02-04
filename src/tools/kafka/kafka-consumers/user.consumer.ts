import { FavoriteServices } from "../../../app/modules/favorite/favorite.service";
import { UserHelper } from "../../../app/modules/user/user.helper";
import { UserService } from "../../../app/modules/user/user.service";
import { handleCreditPurchase } from "../../../handlers/handleCreditPurchase";
import { handleSubscriptionPurchase } from "../../../handlers/handleSubscriptionPurchase";
import { kafkaConsumer } from "../kafka-producers/kafka.consumer"

export const userConsumer = async ()=>{
    await kafkaConsumer({groupId:"user",topic:"user",cb:async (data:{type:string,data:any})=>{
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
            default:
                break;
        }
       } catch (error) {
        console.log(error);
        
       }
    }})
}