import db from '../database';
import { Customer } from '../../core/types';

export class CustomerRepository {
  async create(data: Omit<Customer, 'id' | 'code' | 'createdAt'>): Promise<Customer> {
    const code = `CUST-${Date.now()}`;
    const id = await db.run(
      `INSERT INTO customers (code, name, phone, email, status) VALUES (?, ?, ?, ?, ?)`,
      [code, data.name, data.phone, data.email, data.status || 'regular']
    );
    const customer = await this.findById(id);
    if (!customer) throw new Error('Failed to create customer');
    return customer;
  }

  async findById(id: number): Promise<Customer | null> {
    return new Promise((resolve) => {
      db.query<any>('SELECT * FROM customers WHERE id = ?', [id], (rows) => {
        resolve(rows.length > 0 ? this.mapRow(rows[0]) : null);
      });
    });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return new Promise((resolve) => {
      db.query<any>('SELECT * FROM customers WHERE phone = ?', [phone], (rows) => {
        resolve(rows.length > 0 ? this.mapRow(rows[0]) : null);
      });
    });
  }

  async findAll(): Promise<Customer[]> {
    return new Promise((resolve) => {
      db.query<any>('SELECT * FROM customers ORDER BY created_at DESC', [], (rows) => {
        resolve(rows.map(row => this.mapRow(row)));
      });
    });
  }

  private mapRow(row: any): Customer {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      phone: row.phone,
      email: row.email,
      status: row.status,
      visitCount: row.visit_count,
      loyaltyPoints: row.loyalty_points,
      createdAt: new Date(row.created_at)
    };
  }
}

export default new CustomerRepository();
