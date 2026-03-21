import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface StoredImage {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  type: 'receipt' | 'document' | 'photo' | 'other';
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
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'data/uploads');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const subdirs = ['receipts', 'documents', 'photos', 'temp'];
    subdirs.forEach(dir => {
      const dirPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async saveImage(file: any, type: string = 'temp'): Promise<StoredImage> {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${id}${ext}`;
    const destPath = path.join(this.uploadDir, type, filename);

    // Move file
    fs.renameSync(file.path, destPath);

    const stats = fs.statSync(destPath);

    const storedImage: StoredImage = {
      id,
      filename,
      originalName: file.originalname,
      path: destPath,
      url: `/uploads/${type}/${filename}`,
      type: type as any,
      metadata: {
        size: stats.size,
        mimeType: file.mimetype,
      },
      createdAt: new Date(),
    };

    return storedImage;
  }

  getImage(imageId: string): StoredImage | undefined {
    // Implementation for getting image by ID
    return undefined;
  }

  deleteImage(imageId: string): boolean {
    // Implementation for deleting image
    return true;
  }
}

export default new ImageService();
