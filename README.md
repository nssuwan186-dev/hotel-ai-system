# 🏨 Hotel AI Management System

Hotel management system with **Google Gemini AI** and **Telegram Bot** integration.

## Features

- 👥 Customer Management (VIP, blacklist, loyalty points)
- 🛏️ Room Management (availability, pricing)
- 📅 Booking System (check-in/out, deposits)
- 💳 Payment Processing
- 📊 Daily Reports (occupancy, revenue)
- 🤖 AI Integration (Google Gemini)
- 📱 Telegram Bot Control
- 🌐 REST API
- 💻 CLI Interface

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment (add your API keys)
cp .env.example .env

# Run all services
npm run dev

# Or run individually
npm run api       # REST API server
npm run cli       # Interactive CLI
npm run telegram  # Telegram bot
```

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| /start | Welcome message |
| /customers | List all customers |
| /rooms | List all rooms |
| /available | Available rooms |
| /ai <question> | Ask AI assistant |
| /help | Show help |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/customers | List customers |
| POST | /api/customers | Create customer |
| GET | /api/rooms | List rooms |
| GET | /api/rooms/available | Available rooms |
| POST | /api/ai/chat | Chat with AI |

## Environment Variables

```env
GEMINI_API_KEY=your_api_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
NODE_ENV=development
DB_PATH=./data/db/hotel.sqlite
PORT=3000
```

## Project Structure

```
hotel-ai-system/
├── src/
│   ├── core/           # Types & AI provider
│   ├── database/       # Database & repositories
│   ├── services/       # Business logic
│   ├── api/            # REST API
│   └── cli/            # Command line interface
├── data/
│   ├── db/             # SQLite database
│   └── brain/          # AI system prompt
└── docs/               # Documentation
```

## License

MIT
