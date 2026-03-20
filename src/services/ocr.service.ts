import Tesseract from 'tesseract.js';
import aiProvider from '../core/ai-provider';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  imageUrl: string;
  timestamp: Date;
}

export interface ImageAnalysis {
  type: 'document' | 'id_card' | 'passport' | 'receipt' | 'invoice' | 'unknown';
  confidence: number;
  extractedData: any;
  rawText: string;
  suggestions: string[];
}

export class OCRService {
  // Process image with OCR
  async processImage(imageUrlOrBuffer: string | Buffer): Promise<OCRResult> {
    try {
      const worker = await Tesseract.createWorker('tha+eng');
      
      const ret = await worker.recognize(imageUrlOrBuffer);
      
      await worker.terminate();

      return {
        text: ret.data.text,
        confidence: ret.data.confidence,
        language: ret.data.language,
        imageUrl: typeof imageUrlOrBuffer === 'string' ? imageUrlOrBuffer : 'buffer',
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error('OCR Error:', error.message);
      throw error;
    }
  }

  // Analyze image type and extract data
  async analyzeImage(imageUrlOrBuffer: string | Buffer): Promise<ImageAnalysis> {
    // Step 1: Extract text with OCR
    const ocrResult = await this.processImage(imageUrlOrBuffer);
    
    // Step 2: Use AI to analyze the text
    const analysisPrompt = `Analyze this extracted text from an image and determine:
1. What type of document is this? (options: document, id_card, passport, receipt, invoice, unknown)
2. Extract structured data (name, phone, dates, amounts, etc.)
3. Provide confidence score (0-100)
4. Suggest any corrections or clarifications needed

Extracted text:
${ocrResult.text}

Respond in JSON format:
{
  "type": "document|id_card|passport|receipt|invoice|unknown",
  "confidence": 0-100,
  "extractedData": {},
  "suggestions": []
}`;

    try {
      const aiResponse = await aiProvider.query(analysisPrompt);
      
      // Parse AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        type: analysis.type || 'unknown',
        confidence: analysis.confidence || 0,
        extractedData: analysis.extractedData || {},
        rawText: ocrResult.text,
        suggestions: analysis.suggestions || []
      };
    } catch (error: any) {
      console.error('AI Analysis Error:', error.message);
      return {
        type: 'unknown',
        confidence: 0,
        extractedData: {},
        rawText: ocrResult.text,
        suggestions: ['AI analysis failed, please review manually']
      };
    }
  }

  // Validate extracted data
  validateData(data: any, type: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (type === 'id_card' || type === 'document') {
      // Check for required fields
      if (!data.name) warnings.push('Name not found');
      if (!data.phone && !data.id_number) warnings.push('Contact information not found');
      
      // Validate Thai ID card format (13 digits)
      if (data.id_number && !/^\d{13}$/.test(data.id_number.replace(/-/g, ''))) {
        errors.push('Invalid Thai ID card format');
      }
      
      // Validate phone format
      if (data.phone && !/^0\d{9}$/.test(data.phone.replace(/-/g, ''))) {
        warnings.push('Phone number format may be incorrect');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Generate confirmation message for user review
  generateConfirmation(analysis: ImageAnalysis, validation: any): string {
    let msg = `📋 *Image Analysis Result*\n\n`;
    msg += `📄 Type: *${analysis.type}*\n`;
    msg += `🎯 Confidence: ${analysis.confidence}%\n\n`;
    
    msg += `📊 *Extracted Data:*\n`;
    for (const [key, value] of Object.entries(analysis.extractedData)) {
      msg += `• ${key}: ${value}\n`;
    }
    
    if (validation.errors.length > 0) {
      msg += `\n❌ *Errors:*\n`;
      validation.errors.forEach((e: string) => msg += `• ${e}\n`);
    }
    
    if (validation.warnings.length > 0) {
      msg += `\n⚠️ *Warnings:*\n`;
      validation.warnings.forEach((w: string) => msg += `• ${w}\n`);
    }
    
    if (analysis.suggestions.length > 0) {
      msg += `\n💡 *Suggestions:*\n`;
      analysis.suggestions.forEach((s: string) => msg += `• ${s}\n`);
    }
    
    msg += `\n✅ Type /confirm to save this data`;
    msg += `\n❌ Type /reject to discard`;
    
    return msg;
  }
}

export default new OCRService();
