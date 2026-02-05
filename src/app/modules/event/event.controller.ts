import { Request, Response, NextFunction } from 'express';
import { EventServices } from './event.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createEvent = catchAsync(async (req: Request, res: Response) => {
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    const result = await EventServices.createEventToDB(data);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Event created successfully',
        data: result,
    });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
    const result = await EventServices.getEventFromDB();
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Event data retrieved successfully',
        data: result,
    });
});


const updateEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ...data } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    data.image = image
    const result = await EventServices.updateEventToDB(id, data);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Event updated successfully',
        data: result,
    });
});


const deleteEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await EventServices.deleteEventFromDB(id);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Event deleted successfully',
        data: result,
    });
});

export const EventController = {
    createEvent,
    getAllEvents,
    updateEvent,
    deleteEvent
};
