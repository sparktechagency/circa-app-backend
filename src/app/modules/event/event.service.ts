import { EventModel, IEvent } from './event.interface';
import { Event } from './event.model';

const createEventToDB = async (event: IEvent): Promise<IEvent> => {
    const result = await Event.create(event);
    return result;
};


const getEventFromDB = async (): Promise<IEvent[]> => {
    const result = await Event.find({ status: 'active' }).populate('gifts').sort({ createdAt: -1 });
    return result;
};

const updateEventToDB = async (id: string, event: IEvent): Promise<IEvent | null> => {
    const result = await Event.findOneAndUpdate({ _id: id }, event, { new: true });
    return result;
};


const deleteEventFromDB = async (id: string): Promise<IEvent | null> => {
    const result = await Event.findOneAndUpdate({ _id: id }, { status: 'delete' }, { new: true });
    return result;
};

export const EventServices = {
    createEventToDB,
    getEventFromDB,
    updateEventToDB,
    deleteEventFromDB
};
