import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export class GWSConnector {
  private sheets: any = null;
  private drive: any = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const credsPath = path.join(process.cwd(), 'data/google-credentials.json');
      
      if (!fs.existsSync(credsPath)) {
        console.log('⚠️ Google credentials not found');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;
      console.log('✅ Google Workspace Connector initialized');
    } catch (error: any) {
      console.error('❌ Google Connector error:', error.message);
    }
  }

  async createSpreadsheet(title: string) {
    if (!this.sheets) return null;
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: { properties: { title } },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error:', error.message);
      return null;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export default new GWSConnector();
