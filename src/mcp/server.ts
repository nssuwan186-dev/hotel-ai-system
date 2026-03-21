import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import db from '../database/database';

// Create MCP Server
export const hotelMcpServer = new McpServer({
  name: 'hotel-ai-system',
  version: '1.0.0',
  description: 'Hotel Management System MCP Server'
});

// Register Hotel Tools

// 1. Check Room Availability
hotelMcpServer.tool(
  'check_room_availability',
  'Check if rooms are available for given dates',
  {
    checkIn: { type: 'string', description: 'Check-in date (YYYY-MM-DD)' },
    checkOut: { type: 'string', description: 'Check-out date (YYYY-MM-DD)' },
    roomType: { type: 'string', optional: true, description: 'Room type (single, double, suite, deluxe)' },
  },
  async ({ checkIn, checkOut, roomType }) => {
    try {
      let sql = `SELECT * FROM rooms WHERE status = 'available'`;
      const params: any[] = [];

      if (roomType) {
        sql += ' AND type = ?';
        params.push(roomType);
      }

      const rooms = await db.query(sql, params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              available: rooms.length,
              rooms: rooms.map((r: any) => ({
                roomNumber: r.room_number,
                type: r.type,
                pricePerNight: r.price_per_night,
                capacity: r.capacity
              }))
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// 2. Get Customer Info
hotelMcpServer.tool(
  'get_customer',
  'Get customer information by phone or ID',
  {
    identifier: { type: 'string', description: 'Customer phone number or ID' }
  },
  async ({ identifier }) => {
    try {
      const isPhone = /^\d+$/.test(identifier);
      const sql = isPhone 
        ? 'SELECT * FROM customers WHERE phone = ?'
        : 'SELECT * FROM customers WHERE id = ?';
      
      const customers = await db.query(sql, [identifier]);

      if (customers.length === 0) {
        return {
          content: [{ type: 'text', text: 'Customer not found' }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              customer: customers[0]
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// 3. Create Booking
hotelMcpServer.tool(
  'create_booking',
  'Create a new hotel booking',
  {
    customerId: { type: 'number', description: 'Customer ID' },
    roomId: { type: 'number', description: 'Room ID' },
    checkIn: { type: 'string', description: 'Check-in date (YYYY-MM-DD)' },
    checkOut: { type: 'string', description: 'Check-out date (YYYY-MM-DD)' }
  },
  async ({ customerId, roomId, checkIn, checkOut }) => {
    try {
      const code = `BK-${Date.now()}`;
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get room price
      const rooms = await db.query('SELECT price_per_night FROM rooms WHERE id = ?', [roomId]);
      if (rooms.length === 0) {
        return {
          content: [{ type: 'text', text: 'Room not found' }],
          isError: true
        };
      }

      const roomPrice = parseFloat(rooms[0].price_per_night);
      const totalPrice = roomPrice * totalNights;
      const deposit = totalPrice * 0.3;

      const id = await db.run(
        `INSERT INTO bookings (code, customer_id, room_id, check_in, check_out, total_nights, room_price, total_price, deposit_amount, status, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, customerId, roomId, checkIn, checkOut, totalNights, roomPrice, totalPrice, deposit, 'confirmed', deposit > 0 ? 'partial' : 'unpaid']
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              booking: {
                id,
                code,
                customerId,
                roomId,
                checkIn,
                checkOut,
                totalNights,
                totalPrice,
                deposit
              }
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// 4. Get Daily Report
hotelMcpServer.tool(
  'get_daily_report',
  'Get daily hotel operations report',
  {
    date: { type: 'string', optional: true, description: 'Date (YYYY-MM-DD), defaults to today' }
  },
  async ({ date }) => {
    try {
      const reportDate = date || new Date().toISOString().split('T')[0];

      const [bookings, revenue, checkins, checkouts] = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM bookings WHERE DATE(check_in) = ?', [reportDate]),
        db.query('SELECT SUM(total_price) as total FROM bookings WHERE DATE(check_in) = ?', [reportDate]),
        db.query('SELECT COUNT(*) as count FROM bookings WHERE DATE(check_in) = ? AND status = ?', [reportDate, 'checked-in']),
        db.query('SELECT COUNT(*) as count FROM bookings WHERE DATE(check_out) = ? AND status = ?', [reportDate, 'checked-out'])
      ]);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              date: reportDate,
              bookingsToday: bookings[0]?.count || 0,
              revenueToday: revenue[0]?.total || 0,
              checkinsToday: checkins[0]?.count || 0,
              checkoutsToday: checkouts[0]?.count || 0
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Start MCP Server
export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await hotelMcpServer.connect(transport);
  console.log('✅ MCP Server started');
}

// Auto-start if this is the main module
if (require.main === module) {
  startMcpServer().catch(console.error);
}
