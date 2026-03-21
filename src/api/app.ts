import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import customerRoutes from './routes/customers.routes';
import roomRoutes from './routes/rooms.routes';
import bookingRoutes from './routes/bookings.routes';
import paymentRoutes from './routes/payments.routes';
import reportRoutes from './routes/reports.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notifications.routes';
import websocketService from './middleware/websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web/public')));

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

app.get('/bookings', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/bookings.html'));
});

app.get('/rooms', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/rooms.html'));
});

app.get('/customers', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/customers.html'));
});

app.get('/payments', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/payments.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/reports.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/views/settings.html'));
});

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
websocketService.initialize(server);

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available on ws://localhost:${PORT}/ws`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard\n`);
});

export default app;
