import { Partitioners } from "kafkajs";
import kafka from "../../../config/kafka";


export const kafkaProducer = {
    sendMessage: async <T>(topic: string, message: T) => {
        const producer = kafka.producer({
            createPartitioner:Partitioners.LegacyPartitioner
        });
        await producer.connect();
        await producer.send({
            topic: topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        await producer.disconnect();
    },
};