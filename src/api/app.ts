import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import customerRoutes from './routes/customers.routes';
import roomRoutes from './routes/rooms.routes';
import aiRoutes from './routes/ai.routes';
import notificationsRoutes from './routes/notifications.routes';
// import imagesRoutes from './routes/images.routes';  // Temporarily disabled
import websocketService from './middleware/websocket';
import schedulerService from '../services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files
app.use('/css', express.static(path.join(__dirname, '../web/public/css')));
app.use('/js', express.static(path.join(__dirname, '../web/public/js')));
app.use('/uploads', express.static(path.join(process.cwd(), 'data/uploads')));

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Web Routes
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/dashboard.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/chat.html'));
});

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
// app.use('/api/images', imagesRoutes);  // Temporarily disabled

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), uptime: process.uptime() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.message);
  res.status(500).json({ success: false, error: err.message });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
websocketService.initialize(server);

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`💬 Chat: http://localhost:${PORT}/chat\n`);
});

export default app;
