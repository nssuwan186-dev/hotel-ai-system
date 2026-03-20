import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface StoredImage {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  type: 'receipt' | 'document' | 'photo' | 'id_card' | 'other';
  linkedEntity?: {
    type: 'customer' | 'booking' | 'payment' | 'room';
    id: number;
  };
  metadata: {
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
  ocrText?: string;
  createdAt: Date;
}

export class ImageService {
  private storage: Map<string, StoredImage> = new Map();
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'data/uploads');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const subdirs = ['receipts', 'documents', 'photos', 'temp'];
    subdirs.forEach(dir => {
      const dirPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  // Configure multer for file upload
  getUpload(type: string = 'temp'): any {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(this.uploadDir, type);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    return multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'));
        }
      }
    });
  }

  // Save image and return stored image object
  async saveImage(file: Express.Multer.File, type: string = 'temp'): Promise<StoredImage> {
    const id = uuidv4();
    
    // Optimize image with sharp
    const optimizedPath = path.join(this.uploadDir, type, `${id}.webp`);
    
    await sharp(file.path)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(optimizedPath);

    // Get metadata
    const metadata = await sharp(optimizedPath).metadata();
    const stats = fs.statSync(optimizedPath);

    // Remove original file
    fs.unlinkSync(file.path);

    const storedImage: StoredImage = {
      id,
      filename: `${id}.webp`,
      originalName: file.originalname,
      path: optimizedPath,
      url: `/uploads/${type}/${id}.webp`,
      type: type as StoredImage['type'],
      metadata: {
        size: stats.size,
        mimeType: 'image/webp',
        width: metadata.width,
        height: metadata.height
      },
      createdAt: new Date()
    };

    this.storage.set(id, storedImage);
    return storedImage;
  }

  // Link image to entity
  linkImage(imageId: string, entityType: string, entityId: number): boolean {
    const image = this.storage.get(imageId);
    if (!image) return false;

    image.linkedEntity = {
      type: entityType as StoredImage['linkedEntity']['type'],
      id: entityId
    };

    this.storage.set(imageId, image);
    return true;
  }

  // Get images linked to entity
  getLinkedImages(entityType: string, entityId: number): StoredImage[] {
    return Array.from(this.storage.values()).filter(
      img => img.linkedEntity?.type === entityType && img.linkedEntity?.id === entityId
    );
  }

  // Get image by ID
  getImage(imageId: string): StoredImage | undefined {
    return this.storage.get(imageId);
  }

  // Get all images
  getAllImages(): StoredImage[] {
    return Array.from(this.storage.values());
  }

  // Delete image
  deleteImage(imageId: string): boolean {
    const image = this.storage.get(imageId);
    if (!image) return false;

    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    this.storage.delete(imageId);
    return true;
  }

  // Add OCR text to image
  addOCRText(imageId: string, ocrText: string): boolean {
    const image = this.storage.get(imageId);
    if (!image) return false;

    image.ocrText = ocrText;
    this.storage.set(imageId, image);
    return true;
  }

  // Get receipt images
  getReceipts(): StoredImage[] {
    return Array.from(this.storage.values()).filter(img => img.type === 'receipt');
  }

  // Search images
  searchImages(query: string): StoredImage[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.storage.values()).filter(img => 
      img.originalName.toLowerCase().includes(lowerQuery) ||
      img.ocrText?.toLowerCase().includes(lowerQuery)
    );
  }
}

export default new ImageService();
