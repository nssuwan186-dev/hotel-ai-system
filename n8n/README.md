# n8n Automation Workflows

## 📋 Workflows

### 1. Booking Reminder (`booking-reminder.json`)
- **Trigger**: Every 24 hours
- **Action**: Send email reminder to customers with bookings tomorrow
- **APIs Used**: 
  - GET `/api/bookings/upcoming?days=1`
  - POST `/api/notifications/email`

### 2. Payment Confirmation (`payment-notification.json`)
- **Trigger**: Webhook at `/webhook/payment-confirm`
- **Action**: Send payment confirmation email and update booking status
- **APIs Used**:
  - POST `/api/notifications/email`
  - POST `/api/bookings/:id/update-status`

### 3. Daily Report (`daily-report.json`)
- **Trigger**: Every day at 8:00 AM
- **Action**: Send daily operations report to staff
- **APIs Used**:
  - GET `/api/reports/daily-summary`
  - POST `/api/notifications/email`

## 🚀 Setup

### Option 1: Docker (Recommended)
```bash
# Start n8n
docker-compose -f docker-compose.n8n.yml up -d

# Access n8n
open http://localhost:5678

# Login
Username: admin
Password: hotel123
```

### Option 2: Import Workflows Manually
1. Open n8n at http://localhost:5678
2. Go to Workflows
3. Click "Import from File"
4. Select each JSON file in `workflows/` folder
5. Activate each workflow

## 🔧 Configuration

### Environment Variables
```bash
# .env.n8n
N8N_PASSWORD=hotel123
N8N_BASIC_AUTH_USER=admin
WEBHOOK_URL=http://localhost:5678
```

### API Endpoints Required
Make sure the hotel API server is running at:
```
http://localhost:3000
```

For Docker, use:
```
http://host.docker.internal:3000
```

## 📊 Testing Workflows

### Test Booking Reminder
```bash
# Create a test booking for tomorrow
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "roomId": 1,
    "checkIn": "tomorrow date",
    "checkOut": "day after tomorrow"
  }'

# Trigger workflow manually in n8n UI
```

### Test Payment Webhook
```bash
curl -X POST http://localhost:5678/webhook/payment-confirm \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "bookingId": 1,
      "email": "test@example.com",
      "customerName": "Test Customer",
      "amount": 1500
    }
  }'
```

## 🎯 Next Steps

1. Configure actual email service (Gmail, SendGrid, etc.)
2. Set up Google Workspace CLI integration
3. Add more workflows (customer follow-up, maintenance reminders, etc.)
4. Monitor workflow executions
5. Set up error handling and notifications

## 📞 Support

For n8n documentation: https://docs.n8n.io
