#!/bin/bash
# Quick Start - Start API Server
echo "🚀 Starting Hotel AI API Server..."
pm2 start ecosystem.config.js --env production
echo "✅ Server started!"
echo "📍 Dashboard: http://localhost:3000"
echo "📍 Chat: http://localhost:3000/chat"
echo "📍 Settings: http://localhost:3000/settings"
