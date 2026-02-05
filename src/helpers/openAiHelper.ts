import { chatbot } from '../config/openai';

const askAI = async (prompt: string) => {
  const completion = await chatbot.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a job recommendation engine. Return only valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content || '';
  console.log(raw);

  const clean = raw
    .replace(/\n/g, '')
    .replace(/```json|```/g, '')
    .trim();

  return JSON.parse(clean);
};

const checkIsTheMessageSuspicious =async (message: string, chatId: string): Promise<{
  chatId: string;
  status: 'simple' | 'warning' | 'danger';
  reason: string;
}> => {
  try {
    const prompt = `
You are given a chat message for moderation analysis.

Chat ID: ${chatId}

User message:
"${message}"

Your task:
- Analyze the message carefully.
- Determine whether it contains or implies violence, sexual content, or any suspicious intent.

Classification rules:
- "simple" → no suspicious, violent, or sexual content
- "warning" → mildly suspicious, suggestive, or borderline content
- "danger" → clear violence, sexual content, or harmful intent

Return ONLY a valid JSON object in the following format:

{
  "chatId": "${chatId}",
  "status": "simple | warning | danger",
  "reason": "Brief explanation of why this status was assigned"
}
`;

    return askAI(prompt) as any;
  } catch (error) {
    return {
      chatId: chatId,
      status: 'simple',
      reason: 'AI error',
    };
  }
};

export const OpenAiHelper = {
    checkIsTheMessageSuspicious
};
