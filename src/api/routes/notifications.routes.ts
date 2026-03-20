import { Router } from 'express';
import notificationService from '../../services/notification.service';

const router = Router();

// Get all notifications
router.get('/', (req, res, next) => {
  try {
    const { limit = '20', unread = 'false' } = req.query;
    const notifications = notificationService.getNotifications(
      parseInt(limit as string),
      unread === 'true'
    );
    
    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: notificationService.getUnreadCount()
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// Get unread count
router.get('/unread/count', (req, res, next) => {
  try {
    const count = notificationService.getUnreadCount();
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    next(error);
  }
});

// Mark as read
router.put('/:id/read', (req, res, next) => {
  try {
    const { id } = req.params;
    const success = notificationService.markAsRead(id);
    
    if (success) {
      res.json({ success: true, message: 'Notification marked as read' });
    } else {
      res.status(404).json({ success: false, error: 'Notification not found' });
    }
  } catch (error: any) {
    next(error);
  }
});

// Mark all as read
router.put('/read-all', (req, res, next) => {
  try {
    const count = notificationService.markAllAsRead();
    res.json({ success: true, data: { markedCount: count } });
  } catch (error: any) {
    next(error);
  }
});

// Get scheduler status
router.get('/scheduler/status', (req, res, next) => {
  try {
    // Import dynamically to avoid circular dependency
    import('../../services/scheduler.service').then(({ default: scheduler }) => {
      const tasks = scheduler.getTaskStatus();
      res.json({ success: true, data: { tasks } });
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
