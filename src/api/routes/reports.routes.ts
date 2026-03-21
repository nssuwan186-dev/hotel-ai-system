import { Router } from 'express';
import db from '../../database/database';

const router = Router();

// GET daily summary
router.get('/daily-summary', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [bookings, revenue, checkins, checkouts] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM bookings WHERE DATE(check_in) = ?', [today]),
      db.query('SELECT SUM(total_price) as total FROM bookings WHERE DATE(check_in) = ?', [today]),
      db.query('SELECT COUNT(*) as count FROM bookings WHERE DATE(check_in) = ? AND status = ?', [today, 'checked-in']),
      db.query('SELECT COUNT(*) as count FROM bookings WHERE DATE(check_out) = ? AND status = ?', [today, 'checked-out'])
    ]);

    res.json({
      success: true,
      data: {
        date: today,
        bookingsToday: (bookings[0] as any)?.count || 0,
        revenueToday: (revenue[0] as any)?.total || 0,
        checkinsToday: (checkins[0] as any)?.count || 0,
        checkoutsToday: (checkouts[0] as any)?.count || 0
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET KPIs
router.get('/kpis', async (req, res, next) => {
  try {
    const [totalRooms, availableRooms, totalCustomers, pendingPayments] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM rooms'),
      db.query('SELECT COUNT(*) as count FROM rooms WHERE status = ?', ['available']),
      db.query('SELECT COUNT(*) as count FROM customers'),
      db.query('SELECT COUNT(*) as count FROM bookings WHERE payment_status = ?', ['unpaid'])
    ]);

    const occupancyRate = (totalRooms[0] as any)?.count > 0 
      ? Math.round((((totalRooms[0] as any)?.count - (availableRooms[0] as any)?.count) / (totalRooms[0] as any)?.count) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalRooms: (totalRooms[0] as any)?.count || 0,
        availableRooms: (availableRooms[0] as any)?.count || 0,
        occupancyRate,
        totalCustomers: (totalCustomers[0] as any)?.count || 0,
        pendingPayments: (pendingPayments[0] as any)?.count || 0
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET monthly report
router.get('/monthly', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const yearNum = parseInt(year as string) || new Date().getFullYear();
    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-31`;

    const [bookings, revenue, expenses] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM bookings WHERE check_in BETWEEN ? AND ?', [startDate, endDate]),
      db.query('SELECT SUM(total_price) as total FROM bookings WHERE check_in BETWEEN ? AND ?', [startDate, endDate]),
      db.query('SELECT SUM(amount) as total FROM payments WHERE DATE(created_at) BETWEEN ? AND ?', [startDate, endDate])
    ]);

    res.json({
      success: true,
      data: {
        year: yearNum,
        month: monthNum,
        totalBookings: (bookings[0] as any)?.count || 0,
        totalRevenue: (revenue[0] as any)?.total || 0,
        totalExpenses: (expenses[0] as any)?.total || 0,
        netProfit: ((revenue[0] as any)?.total || 0) - ((expenses[0] as any)?.total || 0)
      }
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
