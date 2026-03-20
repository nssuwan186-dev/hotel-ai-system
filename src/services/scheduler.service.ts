import cron from 'node-cron';
import db from '../database/database';
import notificationService from './notification.service';

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private taskConfigs: Map<string, ScheduledTask> = new Map();

  constructor() {
    this.initializeTasks();
  }

  private initializeTasks(): void {
    // Check upcoming bookings every hour
    this.scheduleTask(
      'check-upcoming-bookings',
      '0 * * * *',  // Every hour
      async () => {
        console.log('📅 Checking upcoming bookings...');
        await this.checkUpcomingBookings();
      }
    );

    // Check payment due every 6 hours
    this.scheduleTask(
      'check-payment-due',
      '0 */6 * * *',  // Every 6 hours
      async () => {
        console.log('💰 Checking payment due...');
        await this.checkPaymentDue();
      }
    );

    // Daily summary at 8 AM
    this.scheduleTask(
      'daily-summary',
      '0 8 * * *',  // 8 AM daily
      async () => {
        console.log('📊 Generating daily summary...');
        await this.generateDailySummary();
      }
    );

    // Cleanup old data every Sunday at 2 AM
    this.scheduleTask(
      'weekly-cleanup',
      '0 2 * * 0',  // Sunday 2 AM
      async () => {
        console.log('🧹 Running weekly cleanup...');
        await this.weeklyCleanup();
      }
    );

    // Start all tasks
    this.startAll();
  }

  private scheduleTask(id: string, schedule: string, task: () => Promise<void>): void {
    const cronTask = cron.schedule(schedule, async () => {
      try {
        await task();
        this.updateTaskStatus(id, true);
      } catch (error: any) {
        console.error(`Task ${id} failed:`, error.message);
        this.updateTaskStatus(id, false);
      }
    });

    this.tasks.set(id, cronTask);
    this.taskConfigs.set(id, {
      id,
      name: id,
      schedule,
      enabled: true,
      nextRun: this.getNextRun(schedule)
    });

    console.log(`⏰ Scheduled task: ${id} (${schedule})`);
  }

  private async checkUpcomingBookings(): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    db.query<any>(
      `SELECT b.*, c.name as customer_name, r.room_number 
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.status = 'confirmed'
       AND b.check_in >= ? AND b.check_in <= ?
       AND b.check_in > datetime('now', '+1 hour')
       AND b.check_in <= datetime('now', '+24 hours')`,
      [now.toISOString(), tomorrow.toISOString()],
      (bookings) => {
        if (bookings.length > 0) {
          notificationService.createUpcomingBookingsAlert(bookings);
          console.log(`📅 Found ${bookings.length} upcoming bookings`);
        }
      }
    );
  }

  private async checkPaymentDue(): Promise<void> {
    const now = new Date();
    
    db.query<any>(
      `SELECT b.*, c.name as customer_name
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.payment_status = 'unpaid' OR b.payment_status = 'partial'
       AND b.check_in <= datetime('now', '+3 days')`,
      [],
      (bookings) => {
        bookings.forEach((booking: any) => {
          const dueDate = new Date(new Date(booking.check_in).getTime() - 24 * 60 * 60 * 1000);
          notificationService.createPaymentDueAlert(
            booking.id,
            booking.customer_name,
            booking.total_price - booking.deposit_amount,
            dueDate
          );
        });
      }
    );
  }

  private async generateDailySummary(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's stats
    db.query<any>(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as check_ins,
        SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as check_outs,
        SUM(total_price) as total_revenue
       FROM bookings
       WHERE date(created_at) = ?`,
      [today],
      (stats) => {
        if (stats[0]) {
          notificationService.createNotification({
            type: 'system',
            priority: 'medium',
            title: '📊 สรุปประจำวัน',
            message: `การจอง: ${stats[0].total_bookings} | Check-in: ${stats[0].check_ins} | Check-out: ${stats[0].check_outs} | รายได้: ${stats[0].total_revenue} THB`,
            data: stats[0]
          });
        }
      }
    );
  }

  private async weeklyCleanup(): Promise<void> {
    // Clean up old notifications
    notificationService.clear();
    console.log('✅ Cleanup completed');
  }

  private updateTaskStatus(id: string, success: boolean): void {
    const config = this.taskConfigs.get(id);
    if (config) {
      config.lastRun = new Date();
      config.nextRun = this.getNextRun(config.schedule);
      this.taskConfigs.set(id, config);
    }
  }

  private getNextRun(schedule: string): Date {
    // Simple next run calculation
    const now = new Date();
    return new Date(now.getTime() + 3600000); // Approximate
  }

  private startAll(): void {
    for (const [id, task] of this.tasks.entries()) {
      task.start();
    }
    console.log('✅ All scheduled tasks started');
  }

  // Get task status
  getTaskStatus(): ScheduledTask[] {
    return Array.from(this.taskConfigs.values());
  }

  // Pause task
  pauseTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    task.stop();
    const config = this.taskConfigs.get(id);
    if (config) {
      config.enabled = false;
      this.taskConfigs.set(id, config);
    }
    return true;
  }

  // Resume task
  resumeTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    task.start();
    const config = this.taskConfigs.get(id);
    if (config) {
      config.enabled = true;
      this.taskConfigs.set(id, config);
    }
    return true;
  }
}

export default new SchedulerService();
