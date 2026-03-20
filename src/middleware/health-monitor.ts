import { Request, Response } from 'express';
import db from '../database/database';
import logger from '../utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: {
    database: { status: 'up' | 'down'; connected: boolean; responseTime?: number; };
    memory: { status: 'normal' | 'warning' | 'critical'; used: number; total: number; percentage: number; };
    api: { status: 'up' | 'down'; requestsPerMinute: number; };
  };
  alerts: string[];
}

class HealthMonitor {
  private requestCount = 0;
  private startTime = Date.now();

  async getHealthStatus(): Promise<HealthStatus> {
    const alerts: string[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    const dbStatus = db.getStatus();
    if (!dbStatus.connected) {
      overallStatus = 'unhealthy';
      alerts.push('Database disconnected');
    }

    const mem = process.memoryUsage();
    const memPercent = (mem.heapUsed / mem.heapTotal) * 100;
    let memStatus: 'normal' | 'warning' | 'critical' = memPercent > 90 ? 'critical' : memPercent > 70 ? 'warning' : 'normal';
    
    if (memPercent > 90) {
      overallStatus = 'unhealthy';
      alerts.push(`Critical memory: ${memPercent.toFixed(1)}%`);
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      components: {
        database: { status: dbStatus.connected ? 'up' : 'down', connected: dbStatus.connected },
        memory: { status: memStatus, used: Math.round(mem.heapUsed/1024/1024), total: Math.round(mem.heapTotal/1024/1024), percentage: memPercent },
        api: { status: 'up', requestsPerMinute: Math.round(this.requestCount / ((Date.now() - this.startTime) / 60000)) }
      },
      alerts
    };
  }

  incrementRequestCount() { this.requestCount++; }

  getHealthHandler() {
    return async (req: Request, res: Response) => {
      this.incrementRequestCount();
      const status = await this.getHealthStatus();
      res.status(status.status === 'healthy' ? 200 : 503).json(status);
    };
  }
}

export default new HealthMonitor();
