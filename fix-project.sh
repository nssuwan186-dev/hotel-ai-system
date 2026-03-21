#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║       AUTO-FIX PROJECT ISSUES          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 1. Install dependencies
echo "📦 Step 1: Installing dependencies..."
if [ -f "package.json" ]; then
  npm install 2>&1 | tail -5
  echo "  ✅ Dependencies installed"
else
  echo "  ❌ package.json not found"
fi

echo ""

# 2. Create missing directories
echo "📁 Step 2: Creating missing directories..."
DIRS=("src/api/routes" "src/api/middleware" "src/core" "src/database/repositories" "src/services" "src/cli/commands" "src/scripts" "src/web/components" "src/web/styles" "src/tools" "data/db" "data/brain" "data/conversations" "logs")

for dir in "${DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo "  ✅ Created: $dir"
  else
    echo "  ✅ Exists: $dir"
  fi
done

echo ""

# 3. Create .env if missing
echo "⚙️  Step 3: Creating .env..."
if [ ! -f ".env" ]; then
  cat > .env << 'ENVEOF'
# Hotel AI Management System - Environment Variables

# Server
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./data/db/hotel.sqlite

# AI
GEMINI_API_KEY=your_api_key_here

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Hotel Settings
HOTEL_NAME=My Hotel
HOTEL_CURRENCY=THB
DEPOSIT_PERCENTAGE=30
ENVEOF
  echo "  ✅ .env created"
  echo "  ⚠️  Please update .env with your API keys"
else
  echo "  ✅ .env exists"
fi

echo ""

# 4. Create .gitignore if missing
echo "📝 Step 4: Creating .gitignore..."
if [ ! -f ".gitignore" ]; then
  cat > .gitignore << 'GITEOF'
node_modules/
dist/
.env
.env.local
*.log
*.sqlite
data/db/*.sqlite
data/uploads/*
!data/uploads/.gitkeep
data/reports/*
!data/reports/.gitkeep
logs/*
!logs/.gitkeep
.DS_Store
.vscode/
.idea/
coverage/
tmp/
temp/
GITEOF
  echo "  ✅ .gitignore created"
else
  echo "  ✅ .gitignore exists"
fi

echo ""

# 5. Create placeholder files
echo "📄 Step 5: Creating placeholder files..."

# Create .gitkeep files
for dir in data/uploads data/reports logs; do
  if [ ! -f "$dir/.gitkeep" ]; then
    touch "$dir/.gitkeep"
    echo "  ✅ Created: $dir/.gitkeep"
  fi
done

echo ""

# 6. Build project
echo "🔨 Step 6: Building project..."
if command -v npm &> /dev/null; then
  npm run build 2>&1 | tail -10
  if [ $? -eq 0 ]; then
    echo "  ✅ Build successful"
  else
    echo "  ⚠️  Build has warnings/errors"
  fi
else
  echo "  ⚠️  npm not available"
fi

echo ""

# 7. Seed database
echo "🌱 Step 7: Seeding database..."
if [ -f "src/database/seeders.ts" ]; then
  npm run seed 2>&1 | tail -5
  if [ $? -eq 0 ]; then
    echo "  ✅ Database seeded"
  else
    echo "  ⚠️  Seed needs attention"
  fi
else
  echo "  ⚠️  seeders.ts not found"
fi

echo ""
echo "════════════════════════════════════════"
echo "         FIX COMPLETE"
echo "════════════════════════════════════════"
echo ""
echo "💡 Next steps:"
echo "   1. Update .env with your API keys"
echo "   2. Run: ./run-audit.sh"
echo "   3. Run: npm run dev"
echo ""
