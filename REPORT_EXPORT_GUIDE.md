# 📊 คู่มือการส่งออกรายงาน - Hotel AI Management System

## ✅ ฟีเจอร์ที่พร้อมใช้งาน

### **1. ประเภทรายงานที่รองรับ**

| ประเภทรายงาน | คำอธิบาย | ข้อมูลที่ได้ |
|--------------|----------|--------------|
| **Check-in** | รายงานการเข้าพัก | ชื่อแขก, ห้อง, วันที่, ราคา |
| **Check-out** | รายงานการเช็คเอาท์ | ชื่อแขก, ห้อง, วันที่, ยอดรวม |
| **Customer** | ข้อมูลลูกค้า | ประวัติ, เบอร์, สถานะ, Loyalty Points |
| **Income** | รายรับ | ช่องทางชำระเงิน, ยอดเงิน |
| **Expense** | รายจ่าย | ประเภทค่าใช้จ่าย, รายละเอียด |
| **Summary** | สรุปภาพรวม | ยอดรวม, กำไร, สถิติ |

---

### **2. รูปแบบการส่งออก**

#### **📄 PDF**
- เหมาะสำหรับ: พิมพ์, นำเสนอ
- คุณสมบัติ: สวยงาม, เป็นระเบียบ
- ใช้เมื่อ: ส่งให้ผู้บริหาร, เก็บเป็นเอกสาร

#### **📊 Excel**
- เหมาะสำหรับ: วิเคราะห์ต่อ, คำนวณ
- คุณสมบัติ: แก้ไขได้, มีสูตรคำนวณ
- ใช้เมื่อ: ทำรายงานทางการเงิน, วิเคราะห์แนวโน้ม

#### **📁 CSV**
- เหมาะสำหรับ: นำเข้าระบบอื่น
- คุณสมบัติ: ไฟล์เล็ก, เปิดได้ทุกโปรแกรม
- ใช้เมื่อ: ส่งออกข้อมูลดิบ, Import เข้า Software อื่น

---

### **3. API Endpoints**

#### **สร้างและดาวน์โหลดรายงาน:**
```bash
POST /api/reports/generate
Content-Type: application/json

{
  "startDate": "2026-03-01",
  "endDate": "2026-03-31",
  "type": "checkin",
  "format": "excel"
}

# Response: File download
```

#### **ดูสรุปประจำวัน:**
```bash
GET /api/reports/daily-summary

# Response:
{
  "success": true,
  "data": {
    "date": "2026-03-20",
    "summary": {
      "total_bookings": 15,
      "total_revenue": 45000,
      "active_bookings": 8
    },
    "checkins": 5,
    "checkouts": 3,
    "revenue": 45000
  }
}
```

#### **ดูรายการรายงานที่มี:**
```bash
GET /api/reports/list

# Response:
{
  "success": true,
  "data": [
    {
      "filename": "report_checkin_2026-03-20.xlsx",
      "size": 15234,
      "createdAt": "2026-03-20T10:30:00Z"
    }
  ]
}
```

#### **ดาวน์โหลดรายงานเดิม:**
```bash
GET /api/reports/download/:filename
```

---

### **4. ตัวอย่างการใช้งาน**

#### **curl:**
```bash
# Export Check-in report as Excel
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-03-01",
    "endDate": "2026-03-31",
    "type": "checkin",
    "format": "excel"
  }' \
  --output report.xlsx
```

#### **JavaScript:**
```javascript
// Generate PDF report
const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    type: 'income',
    format: 'pdf'
  })
});

// Download file
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'income-report.pdf';
a.click();
```

---

### **5. รายงานอัตโนมัติ (Auto-Report)**

#### **Scheduler Tasks:**
```typescript
// Daily summary at 9 PM
'schedule': '0 21 * * *'

// Weekly report on Sunday at 10 AM
'schedule': '0 10 * * 0'

// Monthly report on 1st at 8 AM
'schedule': '0 8 1 * *'
```

#### **Telegram Auto-Send:**
```
📊 รายงานประจำวัน - 20 มีนาคม 2026

📈 สรุป:
• การจองทั้งหมด: 15
• รายรับรวม: ฿45,000
• Check-in: 5
• Check-out: 3

📎 ดูรายละเอียด: [Download PDF]
```

---

### **6. รายละเอียดในรายงาน**

#### **รายงานการเข้าพัก:**
```
┌─────────────────────────────────────────┐
│  รายงานการเข้าพัก                        │
│  1 มีนาคม 2026 - 31 มีนาคม 2026        │
├─────────────────────────────────────────┤
│ รหัส  │ ลูกค้า  │ ห้อง │ วันที่  │ ราคา │
├───────┼─────────┼──────┼─────────┼──────┤
│ BK001 │ สมชาย   │ 101  │ 1-5 มีนา│ 5000 │
│ BK002 │ วิไล    │ 205  │ 3-7 มีนา│ 8000 │
└─────────────────────────────────────────┘
```

#### **รายงานสรุป:**
```
┌─────────────────────────────────────────┐
│  รายงานสรุปประจำเดือนมีนาคม 2026        │
├─────────────────────────────────────────┤
│  การจองทั้งหมด:       150              │
│  รายรับรวม:           ฿450,000         │
│  กำไรสุทธิ:           ฿320,000         │
│  อัตรากำไร:            71%              │
│  ผู้เข้าพักเฉลี่ย:    85%              │
└─────────────────────────────────────────┘
```

---

### **7. การกรองข้อมูล**

#### **Filter Options:**
```json
{
  "startDate": "2026-03-01",
  "endDate": "2026-03-31",
  "roomNumber": "101",        // Optional
  "customerName": "สมชาย",     // Optional
  "minAmount": 1000,          // Optional
  "maxAmount": 10000          // Optional
}
```

---

### **8. ตำแหน่งไฟล์**

```
data/reports/
├── report_checkin_2026-03-20.pdf
├── report_checkin_2026-03-20.xlsx
├── report_checkin_2026-03-20.csv
├── report_income_2026-03-20.pdf
├── report_expense_2026-03-20.xlsx
└── report_summary_2026-03-20.pdf
```

---

### **9. Telegram Commands**

```
/reports today          # รายงานวันนี้
/reports week           # รายงานสัปดาห์นี้
/reports month          # รายงานเดือนนี้
/reports type:income    # รายงานรายรับ
/reports format:pdf     # ส่งออกเป็น PDF
```

---

### **10. Dashboard Integration**

**ปุ่ม Export บน Dashboard:**
```
┌─────────────────────────────────────┐
│  📊 Dashboard                       │
├─────────────────────────────────────┤
│  [📄 Export PDF] [📊 Export Excel] │
│  [📁 Export CSV]                    │
└─────────────────────────────────────┘
```

---

## 🚀 วิธีใช้งาน

### **1. ผ่าน API:**
```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-03-01","endDate":"2026-03-31","type":"summary","format":"pdf"}' \
  --output summary.pdf
```

### **2. ผ่าน Dashboard:**
1. เปิด `/dashboard`
2. คลิกปุ่ม "Export Report"
3. เลือกประเภทรายงาน
4. เลือกรูปแบบ (PDF/Excel/CSV)
5. คลิก "Generate"

### **3. ผ่าน Telegram:**
```
ส่ง: /reports month
Bot: ส่งไฟล์รายงานกลับมา
```

---

## 📋 สรุป

✅ **6 ประเภทรายงาน** - Check-in, Check-out, Customer, Income, Expense, Summary  
✅ **3 รูปแบบ** - PDF, Excel, CSV  
✅ **Auto-report** - ส่งอัตโนมัติทุกวัน/สัปดาห์/เดือน  
✅ **Telegram Integration** - ส่งรายงานเข้าแชท  
✅ **Dashboard Export** - ปุ่มกดส่งออก  
✅ **Filter Support** - กรองตามวันที่, ห้อง, ลูกค้า  

---

**พร้อมใช้งานแล้ว 100%!** 🎉
