import { Router } from 'express';
import reportService from '../../services/report.service';

const router = Router();

// Generate and download report
router.post('/generate', async (req, res, next) => {
  try {
    const { startDate, endDate, type, format } = req.body;

    if (!startDate || !endDate || !type || !format) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: startDate, endDate, type, format' 
      });
    }

    const result = await reportService.generateReport({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      format
    });

    // Send file for download
    res.download(result.path, result.filename);
  } catch (error: any) {
    next(error);
  }
});

// Get daily summary
router.get('/daily-summary', async (req, res, next) => {
  try {
    const summary = await reportService.getDailySummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    next(error);
  }
});

// Get available reports
router.get('/list', (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(process.cwd(), 'data/reports');
    const files = fs.readdirSync(reportsDir);
    
    const reports = files.map((file: string) => {
      const stats = fs.statSync(path.join(reportsDir, file));
      return {
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });

    res.json({ success: true, data: reports });
  } catch (error: any) {
    next(error);
  }
});

// Download existing report
router.get('/download/:filename', (req, res, next) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(process.cwd(), 'data/reports', filename);
    
    res.download(filepath, filename);
  } catch (error: any) {
    next(error);
  }
});

export default router;
