import { MessageService } from "../../../app/modules/message/message.service";
import { handleImagePurhcase } from "../../../handlers/handleImagePurchase";
import { handleMessagePurchase } from "../../../handlers/handleMessagePurchase";
import { handleSendGift } from "../../../handlers/handleSendGift";
import { handleSuspecuisMessage } from "../../../handlers/handleSuspeciusMessage";
import { kafkaConsumer } from "../kafka-producers/kafka.consumer";


export const chatConsumer = async () => {
    await kafkaConsumer({groupId:"chat-consumer-group-id",topic:"chat",cb:async (data:{type:string,data:any})=>{
        try {
            switch (data.type) {
                case "create":
                    await MessageService.sendMessageToDB(data.data);
                    break;
                case "purchase-message":
                    await handleMessagePurchase(data.data);
                    break;
                case "purchase-images":
                    await handleImagePurhcase(data.data?.user, data.data?.image);
                    break;
                case "send-gift":
                    await handleSendGift(data.data.gift,data.data.user);
                    break;
                case "check-message":
                    await handleSuspecuisMessage(data.data.message, data.data.chat);
                    break;
                case "delete":
                    break;
                case "custom":
                    break;
            }
        } catch (error) {
         console.log(error);
            
        }
    }})
}