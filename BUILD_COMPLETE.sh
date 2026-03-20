#!/bin/bash

echo "🏗️ Building Hotel AI Management System..."

BASE="/data/data/com.termux/files/home/hotel-ai-system"

# Create remaining core files
cat > $BASE/src/index.ts << 'EOF'
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const envPath = path.join(process.cwd(), '.env');
console.log(`\n🏨 Hotel AI Management System`);
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`💾 Database: ${process.env.DB_PATH || './data/db/hotel.sqlite'}`);
console.log(`\n✅ All systems initialized`);
console.log(`\nUsage:`);
console.log(`  API Server: npm run api`);
console.log(`  CLI: npm run cli`);
console.log(`  Tests: npm test`);
console.log(`\n🚀 Ready to use!\n`);

export { };
EOF

echo "✅ src/index.ts created"
