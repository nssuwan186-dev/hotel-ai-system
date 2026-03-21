import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isConnected: boolean = false;

  constructor(dbPath: string = process.env.DB_PATH || './data/db/hotel.sqlite') {
    this.dbPath = dbPath;
    this.initialize();
  }

  private initialize() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 Created directory:', dir);
      }
      
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err);
          return;
        }
        this.isConnected = true;
        console.log('✅ Database connected:', this.dbPath);
        this.createTables();
      });
    } catch (error) {
      console.error('❌ Database initialization error:', error);
    }
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
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
        reference TEXT,
        description TEXT,
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
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
      CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON daily_reports(date);
    `;

    this.db.exec(tables, (err) => {
      if (err) {
        console.error('❌ Error creating tables:', err);
      } else {
        console.log('✅ Tables created/verified');
      }
    });
  }

  query<T>(sql: string, params: any[] = [], callback?: (rows: T[]) => void): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.isConnected) {
        console.error('❌ Database not connected');
        resolve([]);
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error(`❌ Query error: ${err.message}`, { sql, params });
          reject(err);
        } else {
          const result = rows as T[];
          if (callback) callback(result);
          resolve(result);
        }
      });
    });
  }

  run(sql: string, params: any[] = []): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db || !this.isConnected) {
        console.error('❌ Database not connected');
        resolve(0);
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error(`❌ Run error: ${err.message}`, { sql, params });
          reject(err);
        } else {
          resolve(this.lastID || 0);
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
            console.error('❌ Transaction begin failed:', err);
            reject(err);
            return;
          }

          try {
            const result = await fn();
            
            this.db!.exec('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('❌ Transaction commit failed:', commitErr);
                this.db!.exec('ROLLBACK');
                reject(commitErr);
              } else {
                console.log('✅ Transaction committed');
                resolve(result);
              }
            });
          } catch (error: any) {
            console.error('❌ Transaction failed:', error);
            this.db!.exec('ROLLBACK');
            reject(error);
          }
        });
      });
    });
  }

  getStatus() {
    return {
      connected: this.isConnected,
      path: this.dbPath,
      tables: this.getTablesCount()
    };
  }

  private getTablesCount(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(0);
        return;
      }
      this.db.get('SELECT count(*) as count FROM sqlite_master WHERE type="table"', [], (err, row: any) => {
        resolve(row?.count || 0);
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err);
        } else {
          console.log('✅ Database connection closed');
          this.isConnected = false;
        }
      });
    }
  }
}

export default new DatabaseManager();
