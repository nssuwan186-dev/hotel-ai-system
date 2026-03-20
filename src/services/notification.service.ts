import { EventEmitter } from 'events';
import db from '../database/database';

export interface Notification {
  id: string;
  type: 'booking_reminder' | 'booking_alert' | 'payment_due' | 'system' | 'data_update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export class NotificationService extends EventEmitter {
  private notifications: Map<string, Notification> = new Map();
  private subscribers: Map<string, Function[]> = new Map();

  constructor() {
    super();
    this.startCleanup();
  }

  // Create notification
  createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): string {
    const id = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notif: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      read: false
    };

    this.notifications.set(id, notif);
    this.emit('notification', notif);
    this.broadcast(notif);

    console.log(`🔔 Notification: ${notification.title}`);
    return id;
  }

  // Booking reminder
  createBookingReminder(bookingId: number, customerName: string, checkIn: Date, roomNumber: string): string {
    const hoursUntilCheckIn = (new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60);
    
    let message = '';
    let priority: Notification['priority'] = 'medium';

    if (hoursUntilCheckIn <= 2) {
      priority = 'urgent';
      message = `Check-in ในอีก ${Math.round(hoursUntilCheckIn)} ชั่วโมง!`;
    } else if (hoursUntilCheckIn <= 24) {
      priority = 'high';
      message = `Check-in ในอีก ${Math.round(hoursUntilCheckIn)} ชั่วโมง`;
    } else {
      message = `Check-in ในวันที่ ${checkIn.toLocaleDateString('th-TH')}`;
    }

    return this.createNotification({
      type: 'booking_reminder',
      priority,
      title: `🔔 แจ้งเตือน Check-in - ${customerName}`,
      message,
      data: { bookingId, customerName, checkIn, roomNumber, hoursUntilCheckIn }
    });
  }

  // Upcoming bookings alert
  createUpcomingBookingsAlert(bookings: any[]): void {
    bookings.forEach(booking => {
      this.createBookingReminder(
        booking.id,
        booking.customer_name,
        new Date(booking.check_in),
        booking.room_number
      );
    });
  }

  // Payment due notification
  createPaymentDueAlert(bookingId: number, customerName: string, amount: number, dueDate: Date): string {
    return this.createNotification({
      type: 'payment_due',
      priority: 'high',
      title: `💰 แจ้งเตือนการชำระเงิน`,
      message: `${customerName} ยังไม่ได้ชำระเงิน ${amount} THB (ครบกำหนด: ${dueDate.toLocaleDateString('th-TH')})`,
      data: { bookingId, customerName, amount, dueDate }
    });
  }

  // Data update notification
  createDataUpdateAlert(entityType: string, entityId: number, action: string, details?: string): string {
    return this.createNotification({
      type: 'data_update',
      priority: 'low',
      title: `📊 อัพเดทข้อมูล`,
      message: `${entityType} ID ${entityId} - ${action}${details ? ': ' + details : ''}`,
      data: { entityType, entityId, action, details }
    });
  }

  // Get notifications
  getNotifications(limit: number = 20, unreadOnly: boolean = false): Notification[] {
    let notifs = Array.from(this.notifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (unreadOnly) {
      notifs = notifs.filter(n => !n.read);
    }

    return notifs.slice(0, limit);
  }

  // Mark as read
  markAsRead(id: string): boolean {
    const notif = this.notifications.get(id);
    if (!notif) return false;

    notif.read = true;
    this.notifications.set(id, notif);
    this.emit('read', id);
    return true;
  }

  // Mark all as read
  markAllAsRead(): number {
    let count = 0;
    for (const [id, notif] of this.notifications.entries()) {
      if (!notif.read) {
        notif.read = true;
        this.notifications.set(id, notif);
        count++;
      }
    }
    return count;
  }

  // Subscribe to notifications
  subscribe(channel: string, callback: Function): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel)!.push(callback);

    return () => {
      const callbacks = this.subscribers.get(channel);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  // Broadcast to subscribers
  private broadcast(notification: Notification): void {
    for (const [channel, callbacks] of this.subscribers.entries()) {
      callbacks.forEach(cb => cb(notification));
    }
  }

  // Cleanup old notifications
  private startCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [id, notif] of this.notifications.entries()) {
        if (notif.expiresAt && notif.expiresAt < now) {
          this.notifications.delete(id);
        }
      }
    }, 3600000); // Every hour
  }

  // Get unread count
  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.read).length;
  }

  // Clear all
  clear(): void {
    this.notifications.clear();
    this.emit('clear');
  }
}

export default new NotificationService();
