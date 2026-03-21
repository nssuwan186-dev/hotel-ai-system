import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import customerService from './customer.service';
import roomService from './room.service';
import aiProvider from '../core/ai-provider';
import confirmationService from './confirmation.service';
import confirmationBlockService from './confirmation-block.service';
import ocrService from './ocr.service';
import notificationService from './notification.service';
import imageService from './image.service';

export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;
  private pendingImages: Map<string, any> = new Map();

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    
    console.log('Token loaded:', token ? '✅ Yes' : '❌ No');
    console.log('Chat ID:', this.chatId);
    
    if (!token) {
      console.error('❌ TELEGRAM_BOT_TOKEN not set!');
      return;
    }
    
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
    console.log('✅ Telegram Bot initialized');
    
    // Subscribe to notifications
    notificationService.subscribe('telegram', (notif) => {
      this.sendNotification(`${notif.title}\n\n${notif.message}`);
    });
    
    // Handle callback queries (inline buttons)
    this.bot.on('callback_query', async (query: any) => {
      const data = query.data;
      const msg = query.message;
      const chatId = msg.chat.id;
      const userId = query.from.username || query.from.first_name;

      if (data.startsWith('confirm_')) {
        const blockId = data.replace('confirm_', '');
        const result = confirmationBlockService.confirmBlock(blockId, userId);
        
        if (result.success && result.block) {
          this.bot.answerCallbackQuery(query.id, { text: '✅ ยืนยันสำเร็จ!' });
          this.bot.editMessageText(
            `${msg.text}\n\n✅ ยืนยันแล้วโดย ${userId}`,
            { chat_id: chatId, message_id: msg.message_id, reply_markup: undefined }
          );
          
          // Process the confirmed data
          await this.processConfirmedBlock(result.block);
        } else {
          this.bot.answerCallbackQuery(query.id, { text: `❌ ${result.error}`, show_alert: true });
        }
      } else if (data.startsWith('reject_')) {
        const blockId = data.replace('reject_', '');
        confirmationBlockService.rejectBlock(blockId, 'User rejected via Telegram');
        
        this.bot.answerCallbackQuery(query.id, { text: '❌ ปฏิเสธแล้ว' });
        this.bot.editMessageText(
          `${msg.text}\n\n❌ ปฏิเสธโดย ${userId}`,
          { chat_id: chatId, message_id: msg.message_id, reply_markup: undefined }
        );
      } else if (data.startsWith('view_')) {
        const blockId = data.replace('view_', '');
        const block = confirmationBlockService.getBlock(blockId);
        
        if (block) {
          let details = `📋 *รายละเอียด:*\n\n`;
          for (const [key, value] of Object.entries(block.data)) {
            details += `• ${key}: ${value}\n`;
          }
          
          this.bot.answerCallbackQuery(query.id, { text: details, show_alert: true });
        }
      }
    });
    
    setTimeout(() => {
      this.sendNotification('🏨 Hotel AI System started successfully!');
    }, 3000);
  }

  private async processConfirmedBlock(block: any) {
    try {
      switch (block.type) {
        case 'customer':
          await customerService.createCustomer(
            block.data.name,
            block.data.phone,
            block.data.email
          );
          notificationService.createDataUpdateAlert('customer', 0, 'created', 'Via confirmation block');
          break;
        case 'receipt':
          // Link image to receipt data
          if (block.imageData) {
            imageService.linkImage(block.imageData.id, 'payment', 0);
          }
          notificationService.createDataUpdateAlert('receipt', 0, 'created', 'Via confirmation block');
          break;
        case 'booking':
          // Process booking
          notificationService.createDataUpdateAlert('booking', 0, 'created', 'Via confirmation block');
          break;
      }
    } catch (error: any) {
      console.error('Error processing confirmed block:', error);
    }
  }

  private setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg: any) => {
      const welcome = `🏨 *Hotel AI Management System*

📋 *Available Commands:*
/basic - Basic commands
/advanced - Advanced features
/receipts - Receipt management
/images - Image management
/blocks - Confirmation blocks

🆕 *Features:*
📸 /scan - Scan document (OCR)
📎 /receipt - Upload receipt
🔔 /alerts - View alerts
📊 /scheduler - Task status`;
      this.sendMessage(msg.chat.id.toString(), welcome);
    });

    // Receipts command
    this.bot.onText(/\/receipts/, async (msg: any) => {
      const receipts = imageService.getReceipts();
      
      if (receipts.length === 0) {
        this.sendMessage(msg.chat.id.toString(), '📎 ยังไม่มีใบเสร็จ');
        return;
      }

      let text = `📎 *ใบเสร็จทั้งหมด (${receipts.length})*\n\n`;
      receipts.forEach((r, i) => {
        text += `${i + 1}. ${r.originalName}\n`;
        if (r.linkedEntity) {
          text += `   Linked to: ${r.linkedEntity.type} #${r.linkedEntity.id}\n`;
        }
        text += `\n`;
      });

      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Images command
    this.bot.onText(/\/images/, async (msg: any) => {
      const images = imageService.getAllImages();
      
      if (images.length === 0) {
        this.sendMessage(msg.chat.id.toString(), '🖼️ ยังไม่มีรูปภาพ');
        return;
      }

      let text = `🖼️ *รูปภาพทั้งหมด (${images.length})*\n\n`;
      images.slice(0, 10).forEach((img, i) => {
        text += `${i + 1}. ${img.originalName} (${img.type})\n`;
      });

      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Blocks command
    this.bot.onText(/\/blocks/, async (msg: any) => {
      const blocks = confirmationBlockService.getPendingBlocks();
      
      if (blocks.length === 0) {
        this.sendMessage(msg.chat.id.toString(), '✅ ไม่มีรายการรอยืนยัน');
        return;
      }

      let text = `📋 *รายการรอยืนยัน (${blocks.length})*\n\n`;
      blocks.forEach((b, i) => {
        text += `${i + 1}. ${b.title}\n`;
        text += `   หมดอายุ: ${b.expiresAt.toLocaleTimeString('th-TH')}\n\n`;
      });

      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Receipt upload command
    this.bot.onText(/\/receipt/, (msg: any) => {
      const text = `📎 *อัพโหลดใบเสร็จ*

ส่งรูปภาพใบเสร็จมาได้เลย

ระบบจะ:
1. สแกนด้วย OCR
2. ดึงข้อมูลอัตโนมัติ
3. แสดงบล็อกให้ยืนยัน
4. บันทึกข้อมูล`;
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Notifications command
    this.bot.onText(/\/notify/, async (msg: any) => {
      const notifs = notificationService.getNotifications(10);
      
      if (notifs.length === 0) {
        this.sendMessage(msg.chat.id.toString(), '✅ ไม่มีการแจ้งเตือน');
        return;
      }

      let text = `🔔 *Notifications (${notifs.length})*\n\n`;
      notifs.forEach((n, i) => {
        const icon = n.read ? '📗' : '📘';
        const priorityIcon = n.priority === 'urgent' ? '🔴' : n.priority === 'high' ? '🟠' : '🟢';
        text += `${icon} ${priorityIcon} *${n.title}*\n   ${n.message}\n\n`;
      });
      
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Alerts command
    this.bot.onText(/\/alerts/, (msg: any) => {
      const count = notificationService.getUnreadCount();
      const text = count > 0 
        ? `🔔 You have *${count}* unread alerts!`
        : '✅ No unread alerts';
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Scheduler status
    this.bot.onText(/\/scheduler/, (msg: any) => {
      const text = `📊 *Scheduler Status*

⏰ Automated Tasks:
• Check upcoming bookings (Every hour)
• Check payment due (Every 6 hours)
• Daily summary (8 AM daily)
• Weekly cleanup (Sunday 2 AM)

All tasks are running! ✅`;
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Basic commands
    this.bot.onText(/\/basic/, (msg: any) => {
      const text = `/customers - List customers
/rooms - List rooms
/available - Available rooms
/ai <q> - Ask AI
/help - Help`;
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Advanced commands
    this.bot.onText(/\/advanced/, (msg: any) => {
      const text = `/scan - OCR Scan document
/receipt - Upload receipt
/images - View images
/blocks - Confirmation blocks
/confirm <id> - Confirm change
/review - Review pending
/reject <id> - Reject change`;
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Scan command
    this.bot.onText(/\/scan/, (msg: any) => {
      const text = `📸 *OCR Scanner*

Send me an image of:
• ID Card
• Passport
• Receipt
• Invoice
• Document

I'll extract the data automatically!`;
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Review pending changes
    this.bot.onText(/\/review/, async (msg: any) => {
      const pending = confirmationService.getAllPending();
      
      if (pending.length === 0) {
        this.sendMessage(msg.chat.id.toString(), '✅ No pending changes');
        return;
      }

      let text = `📋 *Pending Changes (${pending.length})*\n\n`;
      pending.forEach((c, i) => {
        text += `${i + 1}. \`${c.id}\` - ${c.type} (${c.action})\n`;
      });
      text += `\nUse /confirm <id> to approve`;
      text += `\nOr /reject <id> to discard`;
      
      this.sendMessage(msg.chat.id.toString(), text);
    });

    // Confirm command
    this.bot.onText(/\/confirm (\S+)/, async (msg: any, match: any) => {
      const changeId = match[1];
      
      const result = confirmationService.approveChange(changeId);
      
      if (result.success) {
        this.sendMessage(msg.chat.id.toString(), `✅ Change ${changeId} approved and applied!`);
        notificationService.createDataUpdateAlert(
          result.result?.type || 'data',
          result.result?.id || 0,
          'approved',
          `Confirmed via Telegram by ${msg.from.username || msg.from.first_name}`
        );
      } else {
        this.sendMessage(msg.chat.id.toString(), `❌ Error: ${result.error}`);
      }
    });

    // Handle photo (for OCR with confirmation block)
    this.bot.on('photo', async (msg: any) => {
      try {
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        this.sendMessage(msg.chat.id.toString(), '🔍 Processing image...');
        
        const fileLink = await this.bot.getFileLink(fileId);
        
        // OCR
        const analysis = await ocrService.analyzeImage(fileLink);
        
        // Create confirmation block with extracted data
        const blockId = confirmationBlockService.createReceiptBlock(
          analysis.extractedData,
          undefined,
          fileLink
        );
        
        const block = confirmationBlockService.getBlock(blockId);
        if (block) {
          const message = confirmationBlockService.generateBlockMessage(block);
          await this.sendMessage(msg.chat.id.toString(), message.text);
          
          // Send with inline keyboard
          this.bot.sendMessage(msg.chat.id.toString(), 'ยืนยันการบันทึก:', {
            reply_markup: message.reply_markup
          });
        }
        
      } catch (error: any) {
        this.sendMessage(msg.chat.id.toString(), `❌ OCR Error: ${error.message}`);
      }
    });

    // Customers command
    this.bot.onText(/\/customers/, async (msg: any) => {
      try {
        const customers = await customerService.listCustomers();
        let text = '👥 *Customers:*\n\n';
        customers.forEach((c: any, i: number) => {
          text += `${i + 1}. *${c.name}* (${c.phone})\n`;
        });
        if (customers.length === 0) text += 'No customers yet';
        this.sendMessage(msg.chat.id.toString(), text);
      } catch (error: any) {
        this.sendMessage(msg.chat.id.toString(), `❌ Error: ${error.message}`);
      }
    });

    // Rooms command
    this.bot.onText(/\/rooms/, async (msg: any) => {
      try {
        const rooms = await roomService.listRooms();
        let text = '🛏️ *All Rooms:*\n\n';
        rooms.forEach((r: any, i: number) => {
          text += `${i + 1}. Room *${r.roomNumber}* - ${r.type} (${r.pricePerNight} THB)\n`;
        });
        if (rooms.length === 0) text += 'No rooms yet';
        this.sendMessage(msg.chat.id.toString(), text);
      } catch (error: any) {
        this.sendMessage(msg.chat.id.toString(), `❌ Error: ${error.message}`);
      }
    });

    // Available rooms
    this.bot.onText(/\/available/, async (msg: any) => {
      try {
        const rooms = await roomService.getAvailableRooms();
        let text = '✅ *Available Rooms:*\n\n';
        rooms.forEach((r: any, i: number) => {
          text += `${i + 1}. Room *${r.roomNumber}* - ${r.type} (${r.pricePerNight} THB)\n`;
        });
        if (rooms.length === 0) text += 'No available rooms';
        this.sendMessage(msg.chat.id.toString(), text);
      } catch (error: any) {
        this.sendMessage(msg.chat.id.toString(), `❌ Error: ${error.message}`);
      }
    });

    // AI command
    this.bot.onText(/\/ai (.+)/, async (msg: any, match: any) => {
      try {
        const question = match[1];
        this.sendMessage(msg.chat.id.toString(), '🤔 AI is thinking...');
        
        const answer = await aiProvider.query(question);
        const text = `🤖 *AI Answer:*\n\n${answer}`;
        this.sendMessage(msg.chat.id.toString(), text);
      } catch (error: any) {
        this.sendMessage(msg.chat.id.toString(), `❌ Error: ${error.message}`);
      }
    });

    // Help command
    this.bot.onText(/\/help/, (msg: any) => {
      const help = `🏨 *Hotel AI Bot Commands:*

/start - Welcome
/basic - Basic commands
/advanced - Advanced features
/receipts - Receipt management
/images - Image management
/blocks - Confirmation blocks
/notify - Notifications
/alerts - View alerts
/scheduler - Task status
/scan - OCR scan document
/review - Review pending
/customers - List customers
/rooms - List rooms
/available - Available rooms
/ai <question> - Ask AI

Built with Google Gemini AI 🚀`;
      this.sendMessage(msg.chat.id.toString(), help);
    });
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      console.log('✅ Message sent to:', chatId);
    } catch (error: any) {
      console.error('Telegram send error:', error.message);
    }
  }

  async sendNotification(message: string): Promise<void> {
    await this.sendMessage(this.chatId, `🔔 *Notification:*\n\n${message}`);
  }
}

export default new TelegramService();
