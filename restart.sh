#!/bin/bash
# Quick Restart - Restart All Services
echo "🔄 Restarting Hotel AI Services..."
pm2 restart all
echo "✅ All services restarted!"
