import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import notificationService from '../../services/notification.service';

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Hotel AI System',
        timestamp: new Date().toISOString()
      }));

      // Handle incoming messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Subscribe to notifications
    notificationService.subscribe('websocket', (notification) => {
      this.broadcast({
        type: 'notification',
        data: notification
      });
    });

    console.log('✅ WebSocket server initialized on /ws');
  }

  private handleMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'subscribe':
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel
        }));
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  broadcast(data: any): void {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  sendToClient(clientId: string, data: any): void {
    // Implementation for targeted messaging
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export default new WebSocketService();
