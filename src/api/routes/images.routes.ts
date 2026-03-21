import { Router, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import imageService from '../../services/image.service';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'data/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('เฉพาะไฟล์รูปภาพ (JPEG, PNG) เท่านั้น'));
    }
  }
});

router.post('/upload/receipt', upload.single('image'), async (req: Request, res, next) => {
  try {
    const multerReq = req as any;
    if (!multerReq.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = multerReq.file;
    const storedImage = await imageService.saveImage(file, 'receipt');
    
    res.json({ success: true, data: storedImage });
  } catch (error: any) {
    next(error);
  }
});

router.post('/upload/document', upload.single('image'), async (req: Request, res, next) => {
  try {
    const multerReq = req as any;
    if (!multerReq.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = multerReq.file;
    const storedImage = await imageService.saveImage(file, 'document');
    
    res.json({ success: true, data: storedImage });
  } catch (error: any) {
    next(error);
  }
});

export default router;
