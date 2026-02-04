import { MessageService } from "../../../app/modules/message/message.service";
import { handleMessagePurchase } from "../../../handlers/handleMessagePurchase";
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