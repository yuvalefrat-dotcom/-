import { GoogleGenAI, Type } from "@google/genai";

export const chatWithTutor = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], nativeLanguage: string = 'Hebrew') => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `You are a friendly and encouraging English tutor for ${nativeLanguage} speakers. 
      Your goal is to help them practice English. 
      - If they speak ${nativeLanguage}, respond in English but provide a translation in ${nativeLanguage} for difficult words.
      - Correct their grammar gently.
      - Keep responses short and engaging.
      - Use simple English unless they show advanced skills.`,
    },
    history,
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

export const generateVocabularyGame = async (level: 'beginner' | 'intermediate' | 'advanced', nativeLanguage: string = 'Hebrew') => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 5 English words with their ${nativeLanguage} translations and a simple example sentence for each. Level: ${level}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translation: { type: Type.STRING },
            example: { type: Type.STRING },
          },
          required: ["word", "translation", "example"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const checkTranslation = async (original: string, translation: string, nativeLanguage: string = 'Hebrew') => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user translated "${original}" (in ${nativeLanguage}) to "${translation}" (in English). Is it correct? Provide a score from 0 to 100 and a brief explanation in ${nativeLanguage}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          correctVersion: { type: Type.STRING },
        },
        required: ["score", "feedback", "correctVersion"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const generatePersonalizedPlan = async (profile: { nativeLanguage: string, level: string, goals: string[], interests: string[] }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a personalized 5-step daily English learning plan for a user with the following profile:
    Native Language: ${profile.nativeLanguage}
    Level: ${profile.level}
    Goals: ${profile.goals.join(', ')}
    Interests: ${profile.interests.join(', ')}
    
    CRITICAL PROGRESSION RULE (5 TASKS):
    1. Task 1: SPEAKING (using "speaking" or "chat" features).
    2. Task 2: SPEAKING/CONVERSATION (using "speaking", "chat", or "scenario" features).
    3. Task 3: UNDERSTANDING/LISTENING (using "listen" feature).
    4. Task 4: UNDERSTANDING/VISUAL (using "mystery" or "scenario" features).
    5. Task 5: WRITING/GRAMMAR (using "sentence", "scramble", "match", or "speed" features).
    
    The plan should include 5 specific tasks. Each task should have a title, a short description, and which app feature to use (chat, match, sentence, scenario, speed, mystery, listen, scramble, or speaking).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dailyMessage: { type: Type.STRING, description: `A friendly greeting in ${profile.nativeLanguage} explaining that we focus on speaking first (2 tasks), then understanding (2 tasks), then writing (1 task). Total 5 tasks.` },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                feature: { type: Type.STRING, enum: ["chat", "match", "sentence", "scenario", "speed", "mystery", "listen", "scramble", "speaking"] },
                reason: { type: Type.STRING, description: "Why this task helps the user specifically." }
              },
              required: ["title", "description", "feature", "reason"]
            }
          }
        },
        required: ["dailyMessage", "tasks"]
      },
    },
  });

  return JSON.parse(response.text || "{}");
};
