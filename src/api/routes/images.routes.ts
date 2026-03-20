import { Router } from 'express';
import imageService from '../../services/image.service';
import ocrService from '../../services/ocr.service';

const router = Router();

// Upload receipt image
router.post('/upload/receipt', imageService.getUpload('receipt').single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const storedImage = await imageService.saveImage(req.file, 'receipt');
    
    // Auto OCR
    const ocrResult = await ocrService.processImage(storedImage.path);
    await imageService.addOCRText(storedImage.id, ocrResult.text);

    res.json({
      success: true,
      data: {
        image: storedImage,
        ocr: {
          text: ocrResult.text,
          confidence: ocrResult.confidence
        }
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// Upload document image
router.post('/upload/document', imageService.getUpload('document').single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const storedImage = await imageService.saveImage(req.file, 'document');
    res.json({ success: true, data: storedImage });
  } catch (error: any) {
    next(error);
  }
});

// Link image to entity
router.post('/:id/link', (req, res, next) => {
  try {
    const { id } = req.params;
    const { entityType, entityId } = req.body;

    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, error: 'entityType and entityId required' });
    }

    const success = imageService.linkImage(id, entityType, entityId);
    
    if (success) {
      res.json({ success: true, message: 'Image linked successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Image not found' });
    }
  } catch (error: any) {
    next(error);
  }
});

// Get linked images
router.get('/linked/:entityType/:entityId', (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const images = imageService.getLinkedImages(entityType, parseInt(entityId));
    
    res.json({
      success: true,
      data: {
        images,
        count: images.length
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// Get all receipts
router.get('/receipts', (req, res, next) => {
  try {
    const receipts = imageService.getReceipts();
    
    res.json({
      success: true,
      data: {
        receipts,
        count: receipts.length
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// Search images
router.get('/search', (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const images = imageService.searchImages(q as string);
    
    res.json({
      success: true,
      data: {
        images,
        count: images.length
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// Get image by ID
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const image = imageService.getImage(id);
    
    if (image) {
      res.json({ success: true, data: image });
    } else {
      res.status(404).json({ success: false, error: 'Image not found' });
    }
  } catch (error: any) {
    next(error);
  }
});

// Delete image
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const success = imageService.deleteImage(id);
    
    if (success) {
      res.json({ success: true, message: 'Image deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Image not found' });
    }
  } catch (error: any) {
    next(error);
  }
});

export default router;
