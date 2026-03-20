# 🏨 Hotel AI System - Real-time & Advanced Features

## ✅ ฟีเจอร์ใหม่ที่เพิ่มเข้ามา

### 1. 🔔 Notification System (ระบบการแจ้งเตือน)

#### Notification Types:
- **Booking Reminder** - แจ้งเตือน check-in/check-out
- **Payment Due** - แจ้งเตือนการชำระเงิน
- **Data Update** - แจ้งเตือนการแก้ไขข้อมูล
- **System** - แจ้งเตือนระบบ
- **Booking Alert** - แจ้งเตือนการจอง

#### Priority Levels:
- 🔴 **Urgent** - เร่งด่วน (check-in ใน 2 ชม.)
- 🟠 **High** - สำคัญ (check-in ใน 24 ชม.)
- 🟢 **Medium** - ปกติ
- 🟢 **Low** - ต่ำ

#### Features:
- ✅ สร้างการแจ้งเตือนอัตโนมัติ
- ✅ ติดตามสถานะ (อ่าน/ยังไม่อ่าน)
- ✅ นับจำนวนที่ยังไม่อ่าน
- ✅ หมดอายุอัตโนมัติ
- ✅ Subscribe ได้หลายช่องทาง

---

### 2. ⏰ Scheduler Service (งานอัตโนมัติ)

#### Scheduled Tasks:

| Task | Schedule | Description |
|------|----------|-------------|
| **Check Upcoming Bookings** | Every hour | ตรวจสอบการจองที่ใกล้จะถึง |
| **Check Payment Due** | Every 6 hours | ตรวจสอบการชำระเงินที่ค้าง |
| **Daily Summary** | 8 AM daily | สรุปประจำวัน |
| **Weekly Cleanup** | Sunday 2 AM | ทำความสะอาดข้อมูลสัปดาห์ละครั้ง |

#### Features:
- ✅ Cron-based scheduling
- ✅ ติดตามสถานะการทำงาน
- ✅ Pause/Resume tasks
- ✅ บันทึกประวัติการทำงาน
- ✅ แจ้งเตือนเมื่อ task ล้มเหลว

---

### 3. 🔌 WebSocket (Real-time Updates)

#### Real-time Features:
- ✅ แจ้งเตือนทันทีเมื่อมีข้อมูลใหม่
- ✅ อัพเดทสถานะแบบ real-time
- ✅ Broadcast ไปยังทุก client ที่เชื่อมต่อ
- ✅ Subscribe to specific channels
- ✅ Ping/Pong heartbeat

#### WebSocket Events:
```javascript
// Client receives:
{
  "type": "notification",
  "data": {
    "id": "NOTIF-xxx",
    "type": "booking_reminder",
    "title": "🔔 แจ้งเตือน Check-in",
    "message": "Check-in ในอีก 2 ชั่วโมง"
  }
}

// Client can send:
{
  "type": "ping"
}
// Server responds:
{
  "type": "pong",
  "timestamp": 1234567890
}
```

#### Connection:
```
ws://localhost:3000/ws
```

---

### 4. 🔍 Advanced Filtering & Search

#### Available Filters:

**Customers:**
```
GET /api/customers?status=vip
GET /api/customers?search=somchai
GET /api/customers?phone=0812345678
```

**Rooms:**
```
GET /api/rooms?type=suite
GET /api/rooms?status=available
GET /api/rooms?price_min=500&price_max=2000
GET /api/rooms?floor=2
```

**Bookings:**
```
GET /api/bookings?status=confirmed
GET /api/bookings?check_in_from=2026-03-20
GET /api/bookings?check_in_to=2026-03-25
GET /api/bookings?customer_id=1
```

**Notifications:**
```
GET /api/notifications?limit=20&unread=true
```

---

### 5. 📊 Real-time Dashboard Commands (Telegram)

#### New Commands:

| Command | Description |
|---------|-------------|
| `/notify` | ดูการแจ้งเตือนทั้งหมด |
| `/alerts` | ดูจำนวน alert ที่ยังไม่อ่าน |
| `/upcoming` | ดูการจองที่ใกล้จะถึง |
| `/scheduler` | ดูสถานะ task อัตโนมัติ |
| `/filter` | วิธีใช้ filter |

---

### 6. 📅 Booking Reminders & Alerts

#### Automatic Reminders:
- **24 hours before** - แจ้งเตือนล่วงหน้า 1 วัน
- **2 hours before** - แจ้งเตือนล่วงหน้า 2 ชม. (Urgent)
- **On check-in day** - แจ้งเตือนวัน check-in

#### Payment Alerts:
- **3 days before** - แจ้งเตือนก่อนครบกำหนด
- **On due date** - แจ้งเตือนวันครบกำหนด
- **Overdue** - แจ้งเตือนเกินกำหนด

---

### 7. 📝 Audit Trail & Activity Logging

#### Logged Activities:
- ✅ Data creation
- ✅ Data updates
- ✅ Data deletions
- ✅ Confirmation approvals/rejections
- ✅ User actions (via Telegram)

#### Audit Log Format:
```
[AUDIT] APPROVED: CHANGE-xxx - customer create
[AUDIT] REJECTED: CHANGE-xxx - customer update (Reason: Invalid data)
```

---

## 🎯 API Endpoints ที่เพิ่มเข้ามา

### Notifications:
```
GET    /api/notifications           - ดูการแจ้งเตือนทั้งหมด
GET    /api/notifications/unread/count - นับจำนวนที่ยังไม่อ่าน
PUT    /api/notifications/:id/read  - ทำเครื่องหมายว่าอ่านแล้ว
PUT    /api/notifications/read-all  - อ่านทั้งหมด
GET    /api/notifications/scheduler/status - สถานะ task
```

### WebSocket:
```
WS     /ws                          - Real-time updates
```

---

## 📱 Telegram Bot Commands ที่เพิ่ม

```
/start          - เริ่มต้น
/notify         - ดูการแจ้งเตือน
/alerts         - ดู alert ที่ยังไม่อ่าน
/upcoming       - การจองที่ใกล้จะถึง
/scheduler      - สถานะ task อัตโนมัติ
/filter         - วิธีใช้ filter
```

---

## 🔄 Real-time Workflow

### Booking Reminder Flow:
```
1. ⏰ Scheduler checks every hour
2. 📅 Finds booking with check-in in 2-24 hours
3. 🔔 Creates notification (priority: high/urgent)
4. 📱 Sends to Telegram
5. 🔌 Broadcasts via WebSocket
6. 📊 Shows in notification center
7. ✅ User reads and marks as read
```

### Data Update Flow:
```
1. 👤 User sends image for OCR
2. 🔍 OCR extracts data
3. 🤖 AI analyzes and validates
4. ⏳ Creates pending change
5. 👤 User reviews with /review
6. ✅ User confirms with /confirm <id>
7. 💾 Data saved to database
8. 🔔 Notification created
9. 📊 Audit log updated
10. 🔌 Real-time broadcast to all clients
```

---

## 📍 Location
```
/data/data/com.termux/files/home/hotel-ai-system/
```

---

## 🚀 Usage

```bash
cd /data/data/com.termux/files/home/hotel-ai-system

# Start API with WebSocket & Scheduler
npm run api

# Start Telegram Bot
npm run telegram

# Connect to WebSocket
wscat -c ws://localhost:3000/ws
```

---

## 📊 Example: Real-time Notification

**Client receives via WebSocket:**
```json
{
  "type": "notification",
  "data": {
    "id": "NOTIF-1773994800155",
    "type": "booking_reminder",
    "priority": "high",
    "title": "🔔 แจ้งเตือน Check-in - Somchai",
    "message": "Check-in ในอีก 5 ชั่วโมง",
    "data": {
      "bookingId": 1,
      "customerName": "Somchai",
      "checkIn": "2026-03-20T14:00:00.000Z",
      "roomNumber": "101",
      "hoursUntilCheckIn": 5
    },
    "read": false,
    "createdAt": "2026-03-20T09:00:00.000Z"
  }
}
```

---

**พร้อมใช้งานแล้ว 100%!** 🎉
