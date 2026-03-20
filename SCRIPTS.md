# 🚀 Hotel AI - Run Scripts Guide

## 📋 Quick Start Scripts

### **Main Menu (Recommended)**
```bash
./run.sh
```
Interactive menu with all options!

---

### **Quick Commands**

| Script | Command | Description |
|--------|---------|-------------|
| **Start** | `./start.sh` | Start API Server |
| **Stop** | `./stop.sh` | Stop All Services |
| **Restart** | `./restart.sh` | Restart All Services |
| **Logs** | `./logs.sh` | View PM2 Logs |
| **Status** | `./status.sh` | View System Status |

---

## 🎯 Main Menu Options (`./run.sh`)

```
╔══════════════════════════════════════════════╗
║     🏨  Hotel AI Management System           ║
║          Powered by Google Gemini            ║
╚══════════════════════════════════════════════╝

              📋  Main Menu                   
══════════════════════════════════════════════

  1) 🚀 Start API Server (PM2)
  2) 🌐 Open Dashboard (Browser)
  3) 📱 Start Telegram Bot
  4) 🔍 View System Status
  5) 📊 View Logs (PM2)
  6) ⚙️  Settings (Web UI)
  7) 💬 Chat with AI (Web UI)
  8) 📄 Generate Reports
  9) 💿 Backup Database
  10) 🔄 Restart All Services
  11) 🛑 Stop All Services
  0) 🚪 Exit

══════════════════════════════════════════════
```

---

## 📖 Usage Examples

### **First Time Setup:**
```bash
# 1. Install dependencies
npm install

# 2. Run the main menu
./run.sh

# 3. Select option 1 (Start API Server)
# 4. Select option 2 (Open Dashboard)
```

### **Daily Use:**
```bash
# Quick start
./start.sh

# Or use menu
./run.sh
# → Choose option 1
```

### **Check Status:**
```bash
./status.sh
```

### **View Logs:**
```bash
./logs.sh
```

### **Stop Everything:**
```bash
./stop.sh
```

---

## 🌐 Web URLs

| Page | URL |
|------|-----|
| **Dashboard** | http://localhost:3000/dashboard |
| **Chat** | http://localhost:3000/chat |
| **Settings** | http://localhost:3000/settings |
| **Health Check** | http://localhost:3000/health |

---

## 💡 Tips

1. **Use `./run.sh`** for easy menu navigation
2. **PM2 auto-restarts** if server crashes
3. **Check logs** with `./logs.sh` if something goes wrong
4. **Backup database** regularly (option 9 in menu)

---

## 🐛 Troubleshooting

### **Server won't start:**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Try starting again
./start.sh
```

### **PM2 not installed:**
```bash
npm install -g pm2
```

### **Database errors:**
```bash
# Backup and recreate
cp data/db/hotel.sqlite data/db/hotel.sqlite.backup
rm data/db/hotel.sqlite
./start.sh
```

---

**Happy Managing! 🏨**
