import { Router } from 'express';
import aiProvider from '../../core/ai-provider';

const router = Router();

// Chat endpoint
router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    const response = await aiProvider.query(message);
    
    res.json({ 
      success: true, 
      data: { 
        response,
        timestamp: new Date().toISOString()
      } 
    });
  } catch (error: any) {
    next(error);
  }
});

// AI Status
router.get('/status', (req, res, next) => {
  try {
    res.json({ 
      success: true, 
      data: { 
        initialized: aiProvider.isInitialized(),
        status: aiProvider.isInitialized() ? 'ready' : 'not configured'
      } 
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
