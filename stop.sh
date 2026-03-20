#!/bin/bash
# Quick Stop - Stop All Services
echo "🛑 Stopping Hotel AI Services..."
pm2 stop all
echo "✅ All services stopped!"
