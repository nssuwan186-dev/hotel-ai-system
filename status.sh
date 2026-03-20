#!/bin/bash
# View Status
echo "🔍 System Status:"
pm2 status
echo ""
echo "📊 Health Check:"
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || echo "Server not running"
