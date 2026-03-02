import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { kafkaProducer } from '../../../tools/kafka/kafka-producers/kafka.producer';

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createUserToDB(userData, res);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User created successfully',
      data: result,
    });
  },
);

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    let image = getSingleFilePath(req.files, 'image');

    const data = {
      image,
      ...req.body,
    };
    const result = await UserService.updateProfileToDB(user, data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Profile updated successfully',
      data: result,
    });
  },
);

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  const file = getSingleFilePath(req.files, 'image');
  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'File uploaded successfully',
    data: file,
  });
});

const applyForBeACreator = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const document = getSingleFilePath(req.files, 'doc');
  req.body.document = document;
  const result = await UserService.applyForBeACreator(user, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Creator request sent successfully',
    data: result,
  });
});

const getALlCreatorRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.getALlCreatorRequests(req.query);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Creator data retrieved successfully',
      data: result.requests,
      pagination: result.pagination,
    });
  },
);

const changeStatusOfCreatorRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.changeStatusOfCreatorRequest(
      req.params.id,
      req.body.status,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Creator data retrieved successfully',
      data: result,
    });
  },
);

const getCreatorList = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getCreatorList(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Creator data retrieved successfully',
    data: result.creators,
    pagination: result.pagination,
  });
});

const getCreatorProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getCreatorProfile(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Creator data retrieved successfully',
    data: result,
  });
});

const getMyCreatorList = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMyCreatorList(req.user, req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Creator data retrieved successfully',
    data: result.subscriptions,
    pagination: result.pagination,
  });
});

const getFriendsAndFlattersList = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.getFriendsAndFlattersList(
      req.user,
      req.query,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Creator data retrieved successfully',
      data: result.creators,
      pagination: result.pagination,
    });
  },
);

const blockUser = catchAsync(async (req: Request, res: Response) => {

  
  await kafkaProducer.sendMessage('circa-user', {
    type: 'block-user',
    data: { user: req.user, id: req.body.user },
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User blocked successfully',
  });
});

const getBlockList = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getBlockList(req.user, req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Block data retrieved successfully',
    data: result.blocks,
    pagination: result.pagination,
  });
});

const reportUser = catchAsync(async (req: Request, res: Response) => {
  await kafkaProducer.sendMessage('circa-user', {
    type: 'report-user',
    data: { user: req.user, id: req.body.user, reason: req.body.reason },
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User reported successfully',
  });
});

const getReportList = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getReportedUsers(req.user, req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Report data retrieved successfully',
    data: result.reports,
    pagination: result.pagination,
  });
});


const createConnectedAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createConnectedAccount(req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Connected account created successfully',
    data: result,
  });
});


const userProfileUsingId = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserProfileFromUsingDb(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});


const updateNotificationsSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateNotificationsSettings(req.user, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notifications data updated successfully',
    data: result,
  });
})


const notificationsSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getNotificationsSettings(req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notifications data retrieved successfully',
    data: result,
  });
})


const searchCreators = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.searchCreators(req.query, req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Creators data retrieved successfully',
    data: result.creators,
    pagination: result.pagination,
  });
})

export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  uploadFile,
  applyForBeACreator,
  getALlCreatorRequests,
  changeStatusOfCreatorRequest,
  getCreatorList,
  getCreatorProfile,
  getMyCreatorList,
  getFriendsAndFlattersList,
  blockUser,
  getBlockList,
  reportUser,
  getReportList,
  createConnectedAccount,
  userProfileUsingId,
  updateNotificationsSettings,
  notificationsSettings,
  searchCreators
};
