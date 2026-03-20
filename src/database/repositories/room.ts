import db from '../database';
import { Room } from '../../core/types';

export class RoomRepository {
  async create(data: Omit<Room, 'id' | 'createdAt'>): Promise<Room> {
    const id = await db.run(
      `INSERT INTO rooms (room_number, floor, type, capacity, price_per_night, amenities, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.roomNumber, data.floor, data.type, data.capacity, data.pricePerNight, 
       JSON.stringify(data.amenities), data.status]
    );
    const room = await this.findById(id);
    if (!room) throw new Error('Failed to create room');
    return room;
  }

  async findById(id: number): Promise<Room | null> {
    return new Promise((resolve) => {
      db.query<any>('SELECT * FROM rooms WHERE id = ?', [id], (rows) => {
        resolve(rows.length > 0 ? this.mapRow(rows[0]) : null);
      });
    });
  }

  async findAll(): Promise<Room[]> {
    return new Promise((resolve) => {
      db.query<any>('SELECT * FROM rooms ORDER BY room_number', [], (rows) => {
        resolve(rows.map(row => this.mapRow(row)));
      });
    });
  }

  async findAvailable(): Promise<Room[]> {
    return new Promise((resolve) => {
      db.query<any>("SELECT * FROM rooms WHERE status = 'available' ORDER BY room_number", [], (rows) => {
        resolve(rows.map(row => this.mapRow(row)));
      });
    });
  }

  private mapRow(row: any): Room {
    return {
      id: row.id,
      roomNumber: row.room_number,
      floor: row.floor,
      type: row.type,
      capacity: row.capacity,
      pricePerNight: parseFloat(row.price_per_night),
      amenities: JSON.parse(row.amenities || '[]'),
      status: row.status,
      createdAt: new Date(row.created_at)
    };
  }
}

export default new RoomRepository();
