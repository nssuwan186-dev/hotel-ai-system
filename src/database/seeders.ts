import db from './database';

export class Seeders {
  // Seed Rooms
  async seedRooms() {
    console.log('🛏️ Seeding rooms...');
    
    const rooms = [
      { room_number: '101', floor: 1, type: 'single', capacity: 1, price_per_night: 800, amenities: '["WiFi", "AC"]', status: 'available' },
      { room_number: '102', floor: 1, type: 'double', capacity: 2, price_per_night: 1200, amenities: '["WiFi", "AC", "TV"]', status: 'available' },
      { room_number: '201', floor: 2, type: 'suite', capacity: 3, price_per_night: 1800, amenities: '["WiFi", "AC", "TV", "Kitchen"]', status: 'available' },
      { room_number: '202', floor: 2, type: 'deluxe', capacity: 2, price_per_night: 2000, amenities: '["WiFi", "AC", "TV", "Kitchen", "Jacuzzi"]', status: 'available' },
      { room_number: '301', floor: 3, type: 'presidential', capacity: 4, price_per_night: 5000, amenities: '["WiFi", "AC", "TV", "Kitchen", "Jacuzzi", "Pool"]', status: 'available' }
    ];

    for (const room of rooms) {
      try {
        db.run(
          `INSERT INTO rooms (room_number, floor, type, capacity, price_per_night, amenities, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [room.room_number, room.floor, room.type, room.capacity, room.price_per_night, room.amenities, room.status]
        );
        console.log(`  ✅ Room ${room.room_number} created`);
      } catch (e) {
        console.log(`  ⚠️ Room ${room.room_number} already exists`);
      }
    }
  }

  // Seed Customers
  async seedCustomers() {
    console.log('👥 Seeding customers...');
    
    const customers = [
      { code: 'CUST-001', name: 'สมชาย ใจดี', phone: '0812345678', email: 'somchai@example.com', status: 'regular' },
      { code: 'CUST-002', name: 'วิไล รักดี', phone: '0823456789', email: 'wilai@example.com', status: 'vip' },
      { code: 'CUST-003', name: 'ประภา ดีมาก', phone: '0834567890', email: 'prapha@example.com', status: 'regular' }
    ];

    for (const customer of customers) {
      try {
        db.run(
          `INSERT INTO customers (code, name, phone, email, status) VALUES (?, ?, ?, ?, ?)`,
          [customer.code, customer.name, customer.phone, customer.email, customer.status]
        );
        console.log(`  ✅ Customer ${customer.name} created`);
      } catch (e) {
        console.log(`  ⚠️ Customer ${customer.code} already exists`);
      }
    }
  }

  // Seed Bookings
  async seedBookings() {
    console.log('📅 Seeding bookings...');
    
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const bookings = [
      { code: 'BK-001', customer_id: 1, room_id: 1, check_in: today, check_out: tomorrow, total_nights: 1, room_price: 800, total_price: 800, deposit_amount: 240, status: 'checked_in', payment_status: 'paid' },
      { code: 'BK-002', customer_id: 2, room_id: 2, check_in: today, check_out: nextWeek, total_nights: 7, room_price: 1200, total_price: 8400, deposit_amount: 2520, status: 'confirmed', payment_status: 'partial' }
    ];

    for (const booking of bookings) {
      try {
        db.run(
          `INSERT INTO bookings (code, customer_id, room_id, check_in, check_out, total_nights, room_price, total_price, deposit_amount, status, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [booking.code, booking.customer_id, booking.room_id, booking.check_in.toISOString(), booking.check_out.toISOString(), booking.total_nights, booking.room_price, booking.total_price, booking.deposit_amount, booking.status, booking.payment_status]
        );
        console.log(`  ✅ Booking ${booking.code} created`);
      } catch (e) {
        console.log(`  ⚠️ Booking ${booking.code} already exists`);
      }
    }
  }

  // Run all seeders
  async seedAll() {
    console.log('\n🌱 Starting database seeding...\n');
    
    await this.seedRooms();
    await this.seedCustomers();
    await this.seedBookings();
    
    console.log('\n✅ Database seeding completed!\n');
    
    // Show summary
    this.showSummary();
  }

  // Show summary
  showSummary() {
    console.log('📊 Database Summary:');
    
    db.query<any>('SELECT COUNT(*) as count FROM rooms', [], (rows) => {
      console.log(`  🛏️ Rooms: ${rows[0]?.count || 0}`);
    });
    
    db.query<any>('SELECT COUNT(*) as count FROM customers', [], (rows) => {
      console.log(`  👥 Customers: ${rows[0]?.count || 0}`);
    });
    
    db.query<any>('SELECT COUNT(*) as count FROM bookings', [], (rows) => {
      console.log(`  📅 Bookings: ${rows[0]?.count || 0}`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  const seeders = new Seeders();
  seeders.seedAll().catch(console.error);
}

export default new Seeders();
