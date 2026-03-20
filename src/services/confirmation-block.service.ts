import { EventEmitter } from 'events';

export interface ConfirmationBlock {
  id: string;
  type: 'customer' | 'room' | 'booking' | 'payment' | 'receipt' | 'bulk';
  action: 'create' | 'update' | 'delete';
  title: string;
  description: string;
  data: any;
  imageData?: {
    id: string;
    url: string;
    caption?: string;
  };
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  confirmedAt?: Date;
  confirmedBy?: string;
}

export interface InlineKeyboard {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export class ConfirmationBlockService extends EventEmitter {
  private blocks: Map<string, ConfirmationBlock> = new Map();

  // Create confirmation block
  createBlock(block: Omit<ConfirmationBlock, 'id' | 'createdAt' | 'status'>): string {
    const id = `BLOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const confirmationBlock: ConfirmationBlock = {
      ...block,
      id,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    };

    this.blocks.set(id, confirmationBlock);
    this.emit('block_created', confirmationBlock);
    
    console.log(`📋 Confirmation Block created: ${id}`);
    return id;
  }

  // Generate inline keyboard for Telegram
  generateKeyboard(blockId: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          {
            text: '✅ ยืนยัน',
            callback_data: `confirm_${blockId}`
          },
          {
            text: '❌ ปฏิเสธ',
            callback_data: `reject_${blockId}`
          }
        ],
        [
          {
            text: '👁️ ดูรายละเอียด',
            callback_data: `view_${blockId}`
          },
          {
            text: '✏️ แก้ไข',
            callback_data: `edit_${blockId}`
          }
        ]
      ]
    };
  }

  // Generate block message with image
  generateBlockMessage(block: ConfirmationBlock): { text: string; reply_markup?: InlineKeyboard } {
    let text = `📋 *${block.title}*\n\n`;
    text += `${block.description}\n\n`;
    
    // Add data details
    text += `*รายละเอียด:*\n`;
    for (const [key, value] of Object.entries(block.data)) {
      const label = this.formatLabel(key);
      text += `• ${label}: ${value}\n`;
    }

    if (block.imageData) {
      text += `\n📎 *มีรูปภาพแนบ*`;
      if (block.imageData.caption) {
        text += `\n   ${block.imageData.caption}`;
      }
    }

    text += `\n\n⏳ หมดอายุ: ${block.expiresAt.toLocaleTimeString('th-TH')}`;

    return {
      text,
      reply_markup: this.generateKeyboard(block.id)
    };
  }

  // Confirm block
  confirmBlock(blockId: string, userId?: string): { success: boolean; block?: ConfirmationBlock; error?: string } {
    const block = this.blocks.get(blockId);
    if (!block) {
      return { success: false, error: 'Block not found' };
    }

    if (block.status !== 'pending') {
      return { success: false, error: 'Block already processed' };
    }

    if (block.expiresAt < new Date()) {
      block.status = 'expired';
      this.blocks.set(blockId, block);
      return { success: false, error: 'Block expired' };
    }

    block.status = 'confirmed';
    block.confirmedAt = new Date();
    block.confirmedBy = userId;
    this.blocks.set(blockId, block);
    
    this.emit('block_confirmed', block);
    console.log(`✅ Block confirmed: ${blockId}`);
    
    return { success: true, block };
  }

  // Reject block
  rejectBlock(blockId: string, reason?: string): boolean {
    const block = this.blocks.get(blockId);
    if (!block) return false;

    if (block.status !== 'pending') return false;

    block.status = 'rejected';
    this.blocks.set(blockId, block);
    
    this.emit('block_rejected', { block, reason });
    console.log(`❌ Block rejected: ${blockId}`);
    
    return true;
  }

  // Get block
  getBlock(blockId: string): ConfirmationBlock | undefined {
    return this.blocks.get(blockId);
  }

  // Get all pending blocks
  getPendingBlocks(): ConfirmationBlock[] {
    return Array.from(this.blocks.values()).filter(
      b => b.status === 'pending' && b.expiresAt > new Date()
    );
  }

  // Get blocks by type
  getBlocksByType(type: string): ConfirmationBlock[] {
    return Array.from(this.blocks.values()).filter(b => b.type === type);
  }

  // Cleanup expired blocks
  cleanup(): number {
    const now = new Date();
    let count = 0;
    
    for (const [id, block] of this.blocks.entries()) {
      if (block.expiresAt < now && block.status === 'pending') {
        block.status = 'expired';
        this.blocks.set(id, block);
        count++;
      }
    }
    
    return count;
  }

  // Format label from key
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  // Create receipt block with image
  createReceiptBlock(receiptData: any, imageId?: string, imageUrl?: string): string {
    return this.createBlock({
      type: 'receipt',
      action: 'create',
      title: '📎 บันทึกใบเสร็จ',
      description: 'ยืนยันการบันทึกใบเสร็จใหม่',
      data: receiptData,
      imageData: imageId && imageUrl ? {
        id: imageId,
        url: imageUrl,
        caption: 'รูปภาพใบเสร็จ'
      } : undefined,
      expiresAt: new Date(Date.now() + 3600000)
    });
  }

  // Create customer block
  createCustomerBlock(customerData: any): string {
    return this.createBlock({
      type: 'customer',
      action: 'create',
      title: '👥 เพิ่มลูกค้าใหม่',
      description: 'ยืนยันการเพิ่มลูกค้าใหม่',
      data: customerData,
      expiresAt: new Date(Date.now() + 3600000)
    });
  }

  // Create booking block
  createBookingBlock(bookingData: any): string {
    return this.createBlock({
      type: 'booking',
      action: 'create',
      title: '📅 สร้างการจอง',
      description: 'ยืนยันการสร้างการจองใหม่',
      data: bookingData,
      expiresAt: new Date(Date.now() + 3600000)
    });
  }
}

export default new ConfirmationBlockService();
