import Tesseract from 'tesseract.js';
import imageService from './image.service';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  imageUrl: string;
  timestamp: Date;
}

export class OCRService {
  async processImage(imagePath: string): Promise<OCRResult> {
    try {
      const { data } = await Tesseract.recognize(
        imagePath,
        'tha+eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      return {
        text: data.text,
        confidence: data.confidence,
        language: data.language || 'tha+eng',
        imageUrl: imagePath,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('OCR Error:', error.message);
      throw error;
    }
  }

  async analyzeImage(imagePath: string): Promise<any> {
    const ocrResult = await this.processImage(imagePath);
    
    // Simple analysis - extract common patterns
    const analysis = {
      rawText: ocrResult.text,
      confidence: ocrResult.confidence,
      extractedData: {
        // Try to extract phone numbers
        phones: ocrResult.text.match(/0\d{9}/g) || [],
        // Try to extract emails
        emails: ocrResult.text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [],
        // Try to extract dates
        dates: ocrResult.text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || [],
        // Try to extract amounts
        amounts: ocrResult.text.match(/(?:฿|THB|บาท)\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g) || [],
      }
    };

    return analysis;
  }
}

export default new OCRService();
