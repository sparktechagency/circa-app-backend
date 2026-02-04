import { INotification } from "../../../app/modules/notification/notification.interface";
import { PostHandler } from "../../../app/modules/post/post.handler";
import { emailHelper } from "../../../helpers/emailHelper";
import { sendNotifications, sendNotificationsAdmin } from "../../../helpers/notificationsHelper";
import { ISendEmail } from "../../../types/email";
import { kafkaConsumer } from "../kafka-producers/kafka.consumer";

export const notificationConsumer = async () => {
    await kafkaConsumer({groupId:"utils",topic:"utils",cb:async(data:{type:string,data:any})=>{
        try {
            
            switch (data.type) {
                case "email":
                    await emailHelper.sendEmail(data.data as ISendEmail);
                    break;
                case "notification":
                    if(data.data.receiver?.length){
                        await sendNotifications(data.data as INotification);
                    }else{
                       await sendNotificationsAdmin(data.data as INotification);
                    }
                    break;
                case "post-notification":
                    await PostHandler.notifiyAllUsers(data.data);
                    break;
            }
        } catch (error) {
            console.log(error);
            
        }
    }})
};