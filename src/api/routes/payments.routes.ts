import { Router } from 'express';
import db from '../../database/database';

const router = Router();

// GET all payments
router.get('/', async (req, res, next) => {
  try {
    const { booking_id, status } = req.query;
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params: any[] = [];

    if (booking_id) {
      sql += ' AND booking_id = ?';
      params.push(booking_id);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    
    const payments = await db.query(sql, params);
    res.json({ success: true, data: payments });
  } catch (error: any) {
    next(error);
  }
});

// GET payment by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payments = await db.query('SELECT * FROM payments WHERE id = ?', [id]);
    
    if (payments.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    res.json({ success: true, data: payments[0] });
  } catch (error: any) {
    next(error);
  }
});

// CREATE new payment
router.post('/', async (req, res, next) => {
  try {
    const { bookingId, customerId, amount, method, reference, description } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: amount, method' 
      });
    }

    const code = `PAY-${Date.now()}`;

    const id = await db.run(
      `INSERT INTO payments (code, booking_id, customer_id, amount, method, reference, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, bookingId || null, customerId || null, amount, method, reference || null, description || '', 'completed']
    );

    // Update booking payment status if bookingId provided
    if (bookingId) {
      const [totalPaid] = await db.query('SELECT SUM(amount) as total FROM payments WHERE booking_id = ? AND status = ?', [bookingId, 'completed']);
      const [booking] = await db.query('SELECT total_price FROM bookings WHERE id = ?', [bookingId]);
      
      if (booking && totalPaid) {
        const paymentStatus = (totalPaid as any)?.total >= (booking as any)?.total_price ? 'paid' : 'partial';
        await db.run('UPDATE bookings SET payment_status = ? WHERE id = ?', [paymentStatus, bookingId]);
      }
    }

    const payments = await db.query('SELECT * FROM payments WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: payments[0] });
  } catch (error: any) {
    next(error);
  }
});

export default router;
