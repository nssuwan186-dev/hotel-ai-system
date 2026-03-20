import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import db from '../database/database';
import fs from 'fs';
import path from 'path';

export interface ReportOptions {
  startDate: Date;
  endDate: Date;
  type: 'checkin' | 'checkout' | 'customer' | 'income' | 'expense' | 'summary';
  format: 'pdf' | 'excel' | 'csv';
}

export class ReportService {
  private reportsDir: string;

  constructor() {
    this.reportsDir = path.join(process.cwd(), 'data/reports');
    this.ensureReportsDir();
  }

  private ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Generate report
  async generateReport(options: ReportOptions): Promise<{ filename: string; path: string; data: any }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `report_${options.type}_${timestamp}.${options.format}`;
    const filepath = path.join(this.reportsDir, filename);

    let data;
    
    // Fetch data based on report type
    switch (options.type) {
      case 'checkin':
        data = await this.getCheckinData(options.startDate, options.endDate);
        break;
      case 'checkout':
        data = await this.getCheckoutData(options.startDate, options.endDate);
        break;
      case 'customer':
        data = await this.getCustomerData(options.startDate, options.endDate);
        break;
      case 'income':
        data = await this.getIncomeData(options.startDate, options.endDate);
        break;
      case 'expense':
        data = await this.getExpenseData(options.startDate, options.endDate);
        break;
      case 'summary':
        data = await this.getSummaryData(options.startDate, options.endDate);
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Generate file based on format
    switch (options.format) {
      case 'pdf':
        await this.generatePDF(filepath, data, options.type);
        break;
      case 'excel':
        await this.generateExcel(filepath, data, options.type);
        break;
      case 'csv':
        await this.generateCSV(filepath, data);
        break;
    }

    return { filename, path: filepath, data };
  }

  // Fetch data methods
  private async getCheckinData(start: Date, end: Date) {
    return new Promise<any[]>((resolve) => {
      db.query<any>(
        `SELECT b.code, c.name as customer, c.phone, r.room_number, 
                b.check_in, b.check_out, b.total_nights, b.total_price, b.status
         FROM bookings b
         JOIN customers c ON b.customer_id = c.id
         JOIN rooms r ON b.room_id = r.id
         WHERE b.check_in BETWEEN ? AND ?
         ORDER BY b.check_in DESC`,
        [start.toISOString(), end.toISOString()],
        resolve
      );
    });
  }

  private async getCheckoutData(start: Date, end: Date) {
    return new Promise<any[]>((resolve) => {
      db.query<any>(
        `SELECT b.code, c.name as customer, c.phone, r.room_number, 
                b.check_out, b.total_nights, b.total_price, b.status
         FROM bookings b
         JOIN customers c ON b.customer_id = c.id
         JOIN rooms r ON b.room_id = r.id
         WHERE b.check_out BETWEEN ? AND ?
         AND b.status = 'checked_out'
         ORDER BY b.check_out DESC`,
        [start.toISOString(), end.toISOString()],
        resolve
      );
    });
  }

  private async getCustomerData(start: Date, end: Date) {
    return new Promise<any[]>((resolve) => {
      db.query<any>(
        `SELECT code, name, phone, email, status, visit_count, loyalty_points, created_at
         FROM customers
         WHERE created_at BETWEEN ? AND ?
         ORDER BY created_at DESC`,
        [start.toISOString(), end.toISOString()],
        resolve
      );
    });
  }

  private async getIncomeData(start: Date, end: Date) {
    return new Promise<any[]>((resolve) => {
      db.query<any>(
        `SELECT b.code, c.name as customer, p.method, p.amount, p.created_at
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         JOIN customers c ON b.customer_id = c.id
         WHERE p.created_at BETWEEN ? AND ?
         ORDER BY p.created_at DESC`,
        [start.toISOString(), end.toISOString()],
        resolve
      );
    });
  }

  private async getExpenseData(start: Date, end: Date) {
    return new Promise<any[]>((resolve) => {
      db.query<any>(
        `SELECT category, amount, description, date
         FROM transactions
         WHERE type = 'expense' AND date BETWEEN ? AND ?
         ORDER BY date DESC`,
        [start.toISOString(), end.toISOString()],
        resolve
      );
    });
  }

  private async getSummaryData(start: Date, end: Date) {
    return new Promise<any>((resolve) => {
      db.query<any>(
        `SELECT 
          COUNT(DISTINCT b.id) as total_bookings,
          SUM(b.total_price) as total_revenue,
          SUM(CASE WHEN b.status = 'checked_in' THEN 1 ELSE 0 END) as active_bookings,
          AVG(b.total_price) as avg_booking_value
         FROM bookings b
         WHERE b.check_in BETWEEN ? AND ?`,
        [start.toISOString(), end.toISOString()],
        (results) => {
          resolve(results[0] || {});
        }
      );
    });
  }

  // Generate PDF
  private async generatePDF(filepath: string, data: any, type: string) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text(`Report: ${type.toUpperCase()}`, { align: 'center' });
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString('th-TH')}`, { align: 'center' });
      doc.moveDown();

      // Data table
      if (Array.isArray(data)) {
        data.forEach((item, i) => {
          if (i < 50) { // Limit to 50 rows
            Object.entries(item).forEach(([key, value]) => {
              doc.text(`${key}: ${value}`);
            });
            doc.moveDown(0.5);
          }
        });
      } else {
        Object.entries(data).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });
      }

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  // Generate Excel
  private async generateExcel(filepath: string, data: any, type: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    if (Array.isArray(data) && data.length > 0) {
      // Add headers
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key: key,
        width: 20
      }));

      // Add rows
      data.forEach(item => {
        worksheet.addRow(item);
      });
    }

    await workbook.xlsx.writeFile(filepath);
  }

  // Generate CSV
  private async generateCSV(filepath: string, data: any) {
    if (!Array.isArray(data) || data.length === 0) {
      fs.writeFileSync(filepath, 'No data');
      return;
    }

    const parser = new Parser();
    const csv = parser.parse(data);
    fs.writeFileSync(filepath, csv);
  }

  // Get daily summary for auto-report
  async getDailySummary(): Promise<any> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const summary = await this.getSummaryData(startOfDay, endOfDay);
    const checkins = await this.getCheckinData(startOfDay, endOfDay);
    const checkouts = await this.getCheckoutData(startOfDay, endOfDay);

    return {
      date: today.toISOString().split('T')[0],
      summary,
      checkins: checkins.length,
      checkouts: checkouts.length,
      revenue: summary.total_revenue || 0
    };
  }
}

export default new ReportService();
