
import { Chat } from "../app/modules/chat/chat.model";
import { OpenAiHelper } from "../helpers/openAiHelper";
import { suspiciousContentKeywords } from "../shared/demodata";

export const handleSuspecuisMessage = async (message: string, chat: string) => {
  try {
    const isSuspicious = suspiciousContentKeywords.some(word =>
      new RegExp(`\\b${word}\\b`, 'i').test(message),
    );
    
    if(!isSuspicious){
        return   
    }

    const response = await OpenAiHelper.checkIsTheMessageSuspicious(message,chat);

    if(response.status == 'danger'){
        await Chat.updateOne({ _id: chat }, { status:"block",blockReason:response.reason });
    }
    if(response.status == 'warning'){
        await Chat.updateOne({ _id: chat }, { status:"warning",blockReason:response.reason });
    }
  } catch (error) {
    console.log(error);
  }
};
