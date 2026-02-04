import { PostHelper } from "../../../app/modules/post/post.helper";
import { PostServices } from "../../../app/modules/post/post.service";
import { handlePurhcasePost } from "../../../handlers/handlePurchasePost";
import { kafkaConsumer } from "../kafka-producers/kafka.consumer";

export const postConsumer =async () => {
    await kafkaConsumer({groupId:"post",topic:"post",cb:async(data:{type:string,data:any})=>{
        try {
            switch (data.type) {
                case "save-cache":
                    await PostHelper.savePostIntoSubscribersCache(data.data);
                    break;
                case "purchase-post":
                    await handlePurhcasePost(data.data.user,data.data.post);
                    break;
                case "like-post":
                    await PostServices.likePostIntoDB(data.data);
                    break;
            }
        } catch (error) {
            console.log(error);
            
        }
    }});
}