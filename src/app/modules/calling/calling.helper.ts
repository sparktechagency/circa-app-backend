import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import config from "../../../config";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";

const generateAgoraCallingToken = async (channalName: string, uid: number) => {
  try {
    const role = RtcRole.PUBLISHER;
    const token = RtcTokenBuilder.buildTokenWithUid(
      config.agora.appId!,
      config.agora.appCertificate!,
      channalName,
      uid,
      role,
      Math.floor(Date.now() / 1000) + 3600,
    );

    return token;
  } catch (error: any) {
    console.log(error);
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
    
  }
};

export const CallingHelper = {
  generateAgoraCallingToken,
};
