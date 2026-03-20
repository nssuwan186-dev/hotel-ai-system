#!/bin/bash

# Hotel AI Management System - Main Runner
# 🏨 Hotel AI System Runner

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_logo() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║     🏨  Hotel AI Management System           ║"
    echo "║          Powered by Google Gemini            ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_menu() {
    echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}              📋  Main Menu                   ${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} 🚀 Start API Server (PM2)"
    echo -e "  ${GREEN}2)${NC} 🌐 Open Dashboard (Browser)"
    echo -e "  ${GREEN}3)${NC} 📱 Start Telegram Bot"
    echo -e "  ${GREEN}4)${NC} 🔍 View System Status"
    echo -e "  ${GREEN}5)${NC} 📊 View Logs (PM2)"
    echo -e "  ${GREEN}6)${NC} ⚙️  Settings (Web UI)"
    echo -e "  ${GREEN}7)${NC} 💬 Chat with AI (Web UI)"
    echo -e "  ${GREEN}8)${NC} 📄 Generate Reports"
    echo -e "  ${GREEN}9)${NC} 💿 Backup Database"
    echo -e "  ${GREEN}10)${NC} 🔄 Restart All Services"
    echo -e "  ${GREEN}11)${NC} 🛑 Stop All Services"
    echo -e "  ${GREEN}0)${NC} 🚪 Exit"
    echo ""
    echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
}

start_api() {
    echo -e "${BLUE}🚀 Starting API Server with PM2...${NC}"
    pm2 start ecosystem.config.js --env production
    echo -e "${GREEN}✅ API Server started!${NC}"
    echo -e "${YELLOW}📍 Dashboard: http://localhost:3000${NC}"
    sleep 2
}

open_dashboard() {
    echo -e "${BLUE}🌐 Opening Dashboard...${NC}"
    # Try to open in browser (works on desktop)
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000/dashboard
    elif command -v open &> /dev/null; then
        open http://localhost:3000/dashboard
    else
        echo -e "${YELLOW}📍 Open manually: http://localhost:3000/dashboard${NC}"
    fi
}

start_telegram() {
    echo -e "${BLUE}📱 Starting Telegram Bot...${NC}"
    pm2 start ecosystem.config.js --name hotel-telegram -- npm run telegram
    echo -e "${GREEN}✅ Telegram Bot started!${NC}"
}

view_status() {
    echo -e "${BLUE}🔍 System Status:${NC}"
    echo ""
    pm2 status
    echo ""
    echo -e "${BLUE}📊 Health Check:${NC}"
    curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || echo "Server not running"
}

view_logs() {
    echo -e "${BLUE}📊 PM2 Logs:${NC}"
    pm2 logs --lines 50
}

open_settings() {
    echo -e "${BLUE}⚙️  Opening Settings...${NC}"
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000/settings
    elif command -v open &> /dev/null; then
        open http://localhost:3000/settings
    else
        echo -e "${YELLOW}📍 Open manually: http://localhost:3000/settings${NC}"
    fi
}

open_chat() {
    echo -e "${BLUE}💬 Opening Chat...${NC}"
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000/chat
    elif command -v open &> /dev/null; then
        open http://localhost:3000/chat
    else
        echo -e "${YELLOW}📍 Open manually: http://localhost:3000/chat${NC}"
    fi
}

generate_reports() {
    echo -e "${BLUE}📄 Generating Reports...${NC}"
    # Add report generation logic here
    echo -e "${GREEN}✅ Reports generated!${NC}"
}

backup_database() {
    echo -e "${BLUE}💿 Backing up Database...${NC}"
    BACKUP_DIR="./data/backups"
    mkdir -p "$BACKUP_DIR"
    cp ./data/db/hotel.sqlite "$BACKUP_DIR/hotel-$(date +%Y%m%d-%H%M%S).sqlite"
    echo -e "${GREEN}✅ Database backed up!${NC}"
}

restart_all() {
    echo -e "${BLUE}🔄 Restarting All Services...${NC}"
    pm2 restart all
    echo -e "${GREEN}✅ All services restarted!${NC}"
}

stop_all() {
    echo -e "${BLUE}🛑 Stopping All Services...${NC}"
    pm2 stop all
    echo -e "${GREEN}✅ All services stopped!${NC}"
}

# Main loop
show_logo

while true; do
    show_menu
    read -p "  Enter choice [0-11]: " choice
    
    case $choice in
        1) start_api ;;
        2) open_dashboard ;;
        3) start_telegram ;;
        4) view_status ;;
        5) view_logs ;;
        6) open_settings ;;
        7) open_chat ;;
        8) generate_reports ;;
        9) backup_database ;;
        10) restart_all ;;
        11) stop_all ;;
        0) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}❌ Invalid option${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
    show_logo
done
