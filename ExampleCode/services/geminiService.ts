
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private static instance: GeminiService;
  
  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  // Always create a new AI instance before calls to ensure it uses the current process.env.API_KEY
  public async *sendMessageStream(message: string, history: { role: string, content: string }[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are a world-class senior engineer and AI assistant. Provide concise, helpful, and accurate answers. Use markdown for code blocks and rich formatting.",
      }
    });

    const stream = await chat.sendMessageStream({ message });
    
    for await (const chunk of stream) {
      const response = chunk as GenerateContentResponse;
      yield response.text;
    }
  }
}
