import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 5;

  constructor(dbPath: string = process.env.DB_PATH || './data/db/hotel.sqlite') {
    this.dbPath = dbPath;
    this.initialize();
  }

  private async initialize() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created database directory: ${dir}`);
      }

      await this.connectWithRetry();
    } catch (error: any) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async connectWithRetry() {
    while (this.retryCount < this.maxRetries) {
      try {
        await this.connect();
        return;
      } catch (error: any) {
        this.retryCount++;
        logger.error(`Database connection attempt ${this.retryCount} failed:`, error.message);
        
        if (this.retryCount < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
          logger.info(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    logger.error('Max database retries reached. Giving up.');
    throw new Error('Database connection failed after multiple attempts');
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          this.isConnected = true;
          this.retryCount = 0;
          this.db!.pragma('journal_mode = WAL');
          this.db!.pragma('foreign_keys = ON');
          this.createTables();
          
          logger.info(`✅ Database connected: ${this.dbPath}`);
          resolve();
        });
      } catch (error: any) {
        reject(error);
      }
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createTables() {
    if (!this.db) return;

    const tables = `
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'regular',
        visit_count INTEGER DEFAULT 0,
        loyalty_points INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT UNIQUE NOT NULL,
        floor INTEGER NOT NULL,
        type TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        price_per_night DECIMAL(10,2) NOT NULL,
        amenities TEXT,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        total_nights INTEGER NOT NULL,
        room_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        deposit_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        booking_id INTEGER,
        customer_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        method TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS daily_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        occupancy_rate DECIMAL(5,2) DEFAULT 0,
        total_rooms INTEGER DEFAULT 0,
        occupied_rooms INTEGER DEFAULT 0,
        total_revenue DECIMAL(12,2) DEFAULT 0,
        total_expenses DECIMAL(12,2) DEFAULT 0,
        net_profit DECIMAL(12,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
      CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
    `;

    this.db.exec(tables, (err) => {
      if (err) {
        logger.error('Error creating tables:', err);
      } else {
        logger.info('✅ Tables created/verified');
      }
    });
  }

  query<T>(sql: string, params: any[] = [], callback: (rows: T[]) => void): void {
    if (!this.db || !this.isConnected) {
      logger.error('Database not connected');
      callback([]);
      return;
    }

    this.db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error(`Query error: ${err.message}`, { sql, params });
        callback([]);
      } else {
        callback(rows || []);
      }
    });
  }

  run(sql: string, params: any[] = []): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.isConnected) {
        const error = new Error('Database not connected');
        logger.error(error.message);
        reject(error);
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error(`Run error: ${err.message}`, { sql, params });
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  transaction<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.serialize(async () => {
        this.db!.exec('BEGIN TRANSACTION', async (err) => {
          if (err) {
            logger.error('Transaction begin failed:', err);
            reject(err);
            return;
          }

          try {
            const result = await fn();
            
            this.db!.exec('COMMIT', (commitErr) => {
              if (commitErr) {
                logger.error('Transaction commit failed:', commitErr);
                this.db!.exec('ROLLBACK');
                reject(commitErr);
              } else {
                logger.info('Transaction committed successfully');
                resolve(result);
              }
            });
          } catch (error: any) {
            logger.error('Transaction failed:', error);
            this.db!.exec('ROLLBACK');
            reject(error);
          }
        });
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
        } else {
          logger.info('Database connection closed');
          this.isConnected = false;
        }
      });
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      path: this.dbPath,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

export default new DatabaseManager();
