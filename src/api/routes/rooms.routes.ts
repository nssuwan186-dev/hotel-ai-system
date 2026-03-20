import { Router } from 'express';
import roomService from '../../services/room.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const rooms = await roomService.listRooms();
    res.json({ success: true, data: rooms });
  } catch (error: any) {
    next(error);
  }
});

router.get('/available', async (req, res, next) => {
  try {
    const rooms = await roomService.getAvailableRooms();
    res.json({ success: true, data: rooms });
  } catch (error: any) {
    next(error);
  }
});

export default router;
