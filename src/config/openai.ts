import openai from 'openai';
import config from '.';

export const chatbot = new openai.OpenAI({
    apiKey:config.openai.apiKey!
});