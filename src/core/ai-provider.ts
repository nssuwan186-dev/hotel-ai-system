import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export class AIProvider {
  private client: GoogleGenerativeAI | null = null;
  private model: any = null;
  private systemPrompt: string = '';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    try {
      if (!apiKey) {
        console.warn('⚠️ GEMINI_API_KEY not set');
        return;
      }

      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });

      const promptPath = path.join(process.cwd(), 'data/brain/system-prompt.md');
      if (fs.existsSync(promptPath)) {
        this.systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      }

      console.log('✅ Google Gemini AI initialized');
    } catch (error) {
      console.error('❌ AI initialization error:', error);
    }
  }

  async query(message: string): Promise<string> {
    if (!this.model) {
      return 'AI not configured. Please set GEMINI_API_KEY';
    }

    try {
      const prompt = this.systemPrompt 
        ? `${this.systemPrompt}\n\nUser: ${message}`
        : message;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error('AI Query Error:', error.message);
      return `Error: ${error.message}`;
    }
  }

  isInitialized(): boolean {
    return this.model !== null;
  }
}

export default new AIProvider();
