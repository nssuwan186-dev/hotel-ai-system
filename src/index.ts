import dotenv from 'dotenv';
dotenv.config();

console.log('\n🏨 Hotel AI Management System');
console.log('================================\n');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`💾 Database: ${process.env.DB_PATH || './data/db/hotel.sqlite'}`);
console.log(`📱 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`\n✅ Systems initialized`);
console.log(`\nUsage:`);
console.log(`  API Server: npm run api`);
console.log(`  CLI: npm run cli`);
console.log(`  Telegram: npm run telegram`);
console.log(`\n🚀 Ready!\n`);

// Start Telegram bot if enabled
if (process.env.TELEGRAM_BOT_TOKEN) {
  import('./services/telegram.service').then(({ default: telegramService }) => {
    console.log('🤖 Telegram bot is running...');
    telegramService.sendNotification('🏨 Hotel AI System started successfully!');
  }).catch(err => console.error('Telegram bot error:', err.message));
}
