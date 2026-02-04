import { USER_ROLES } from '../../../enums/user';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';
import { INotification } from '../notification/notification.interface';
import { Creator, CreatorRequest, User } from './user.model';

const acceptTheCreatorRequest = async (reqId: string) => {
  try {
    let request = await CreatorRequest.findOne({ _id: reqId }).lean();
    if (!request) {
      return;
    }
    await Promise.all([
        User.findByIdAndUpdate(request.user, { role: USER_ROLES.CREATOR },{overwriteDiscriminatorKey: true}),
    ]);

    await Creator.findOneAndUpdate({_id:request.user},{
        username: request.username,
        date_of_birth: request.date_of_birth,
        short_bio: request.short_bio,
        document: request.document,
        categories: request.categories,
        friends_and_flirty_mode: request.friends_and_flirty_mode,
        friends_and_flirty_category: request.friends_and_flirty_category,
        age: new Date().getFullYear() - new Date(request.date_of_birth).getFullYear()
    })

  
       await kafkaProducer.sendMessage("utils",{type:"notification",data:{
            title:`Hey ${request.username}! You are now a creator!`,
            message:`The admin approved your creator request! You are now a creator!`,
            isRead:false,
            filePath:"application",
            referenceId:request._id,
            receiver:[request.user]
        } as INotification} )
    
  } catch (error) {
    console.log(error);
    
  }
};

export const UserHelper = {
  acceptTheCreatorRequest,
};
