import db from '../database/database';

export interface PendingChange {
  id: string;
  type: 'customer' | 'room' | 'booking' | 'payment' | 'bulk';
  action: 'create' | 'update' | 'delete';
  data: any;
  originalData?: any;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: Date;
  expiresAt: Date;
}

export class ConfirmationService {
  private pendingChanges: Map<string, PendingChange> = new Map();

  // Create pending change
  createChange(type: PendingChange['type'], action: PendingChange['action'], data: any, originalData?: any): string {
    const id = `CHANGE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const change: PendingChange = {
      id,
      type,
      action,
      data,
      originalData,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour expiry
    };

    this.pendingChanges.set(id, change);
    return id;
  }

  // Get pending change
  getChange(id: string): PendingChange | undefined {
    return this.pendingChanges.get(id);
  }

  // Get all pending changes
  getAllPending(): PendingChange[] {
    return Array.from(this.pendingChanges.values())
      .filter(c => c.status === 'pending' && c.expiresAt > new Date());
  }

  // Approve change
  approveChange(id: string): { success: boolean; result?: any; error?: string } {
    const change = this.pendingChanges.get(id);
    if (!change) {
      return { success: false, error: 'Change not found' };
    }

    if (change.status !== 'pending') {
      return { success: false, error: 'Change already processed' };
    }

    try {
      let result;
      
      switch (change.type) {
        case 'customer':
          result = this.applyCustomerChange(change);
          break;
        case 'room':
          result = this.applyRoomChange(change);
          break;
        case 'bulk':
          result = this.applyBulkChange(change);
          break;
        default:
          return { success: false, error: 'Unknown change type' };
      }

      change.status = 'approved';
      this.pendingChanges.set(id, change);
      
      // Log to audit
      this.logAudit(change, 'approved');
      
      return { success: true, result };
    } catch (error: any) {
      change.status = 'rejected';
      change.reason = error.message;
      this.pendingChanges.set(id, change);
      return { success: false, error: error.message };
    }
  }

  // Reject change
  rejectChange(id: string, reason?: string): boolean {
    const change = this.pendingChanges.get(id);
    if (!change) return false;

    change.status = 'rejected';
    change.reason = reason;
    this.pendingChanges.set(id, change);
    
    this.logAudit(change, 'rejected');
    return true;
  }

  // Apply customer change
  private applyCustomerChange(change: PendingChange): any {
    if (change.action === 'create') {
      const code = `CUST-${Date.now()}`;
      const result = db.run(
        `INSERT INTO customers (code, name, phone, email, status) VALUES (?, ?, ?, ?, ?)`,
        [code, change.data.name, change.data.phone, change.data.email, change.data.status || 'regular']
      );
      return { id: result, code };
    }
    
    if (change.action === 'update' && change.originalData) {
      db.run(
        `UPDATE customers SET name=?, phone=?, email=?, status=? WHERE id=?`,
        [change.data.name, change.data.phone, change.data.email, change.data.status, change.originalData.id]
      );
      return { id: change.originalData.id };
    }
    
    return null;
  }

  // Apply room change
  private applyRoomChange(change: PendingChange): any {
    if (change.action === 'create') {
      const result = db.run(
        `INSERT INTO rooms (room_number, floor, type, capacity, price_per_night, amenities, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [change.data.roomNumber, change.data.floor, change.data.type, 
         change.data.capacity, change.data.pricePerNight, 
         JSON.stringify(change.data.amenities || []), change.data.status || 'available']
      );
      return { id: result };
    }
    return null;
  }

  // Apply bulk change
  private applyBulkChange(change: PendingChange): any {
    const results = [];
    for (const item of change.data.items) {
      const subChange = { ...change, data: item, action: 'create' as const };
      if (change.type === 'customer') {
        results.push(this.applyCustomerChange(subChange));
      } else if (change.type === 'room') {
        results.push(this.applyRoomChange(subChange));
      }
    }
    return { count: results.length, results };
  }

  // Log audit trail
  private logAudit(change: PendingChange, action: string): void {
    console.log(`[AUDIT] ${action.toUpperCase()}: ${change.id} - ${change.type} ${change.action}`);
  }

  // Cleanup expired changes
  cleanup(): number {
    const now = new Date();
    let count = 0;
    for (const [id, change] of this.pendingChanges.entries()) {
      if (change.expiresAt < now && change.status === 'pending') {
        this.pendingChanges.delete(id);
        count++;
      }
    }
    return count;
  }
}

export default new ConfirmationService();
