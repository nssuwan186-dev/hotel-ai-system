import { Router } from 'express';
import db from '../../database/database';

const router = Router();

// GET all bookings
router.get('/', async (req, res, next) => {
  try {
    const { status, customer_id } = req.query;
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (customer_id) {
      sql += ' AND customer_id = ?';
      params.push(customer_id);
    }

    sql += ' ORDER BY created_at DESC';
    
    const bookings = await db.query(sql, params);
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    next(error);
  }
});

// GET booking by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookings = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    res.json({ success: true, data: bookings[0] });
  } catch (error: any) {
    next(error);
  }
});

// CREATE new booking
router.post('/', async (req, res, next) => {
  try {
    const { customerId, roomId, checkIn, checkOut, totalPrice, depositAmount } = req.body;

    if (!customerId || !roomId || !checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: customerId, roomId, checkIn, checkOut' 
      });
    }

    const code = `BK-${Date.now()}`;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const roomPrice = totalPrice / totalNights;
    const deposit = depositAmount || totalPrice * 0.3;

    const id = await db.run(
      `INSERT INTO bookings (code, customer_id, room_id, check_in, check_out, total_nights, room_price, total_price, deposit_amount, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, customerId, roomId, checkIn, checkOut, totalNights, roomPrice, totalPrice, deposit, 'confirmed', deposit > 0 ? 'partial' : 'unpaid']
    );

    const bookings = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: bookings[0] });
  } catch (error: any) {
    next(error);
  }
});

// UPDATE booking
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (paymentStatus) {
      updates.push('payment_status = ?');
      params.push(paymentStatus);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.run(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const bookings = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    res.json({ success: true, data: bookings[0] });
  } catch (error: any) {
    next(error);
  }
});

// DELETE booking
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

// GET upcoming bookings (for n8n)
router.get('/upcoming', async (req, res, next) => {
  try {
    const { days = '1' } = req.query;
    const daysNum = parseInt(days as string);
    
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + daysNum);
    
    const bookings = await db.query(
      `SELECT 
        b.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        r.room_number,
        r.type as room_type
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.status = 'confirmed'
       AND b.check_in BETWEEN ? AND ?
       ORDER BY b.check_in ASC`,
      [today.toISOString().split('T')[0], future.toISOString().split('T')[0]]
    );
    
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    next(error);
  }
});
