/**
 * Image Storage Service
 * Downloads temporary images from BFL and stores them permanently in Firebase Storage
 */

import axios from 'axios';
import { getStorage } from 'firebase-admin/storage';
import * as crypto from 'crypto';
import { getFirebaseApp } from '../config/firebase.config';

export class ImageStorageService {
  private storage = getStorage(getFirebaseApp());
  private bucket = this.storage.bucket();

  constructor() {
    console.log(`[ImageStorage] Using Firebase Storage bucket: ${this.bucket.name}`);
  }

  /**
   * Downloads an image from a temporary URL and uploads it to Firebase Storage
   * @param temporaryUrl The temporary BFL image URL
   * @param taskId The task ID (for organizing storage)
   * @returns Permanent Firebase Storage URL
   */
  async storeImagePermanently(temporaryUrl: string, taskId: string): Promise<string> {
    try {
      console.log(`📥 [ImageStorage] Downloading image from BFL...`);
      console.log(`   URL: ${temporaryUrl.substring(0, 100)}...`);

      // Download the image
      const response = await axios.get(temporaryUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });

      const imageBuffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/jpeg';

      console.log(`   Downloaded ${imageBuffer.length} bytes (${contentType})`);

      // Generate a unique filename
      const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
      const extension = this.getExtensionFromContentType(contentType);
      const filename = `task-images/${taskId}/${imageHash}${extension}`;

      // Upload to Firebase Storage
      console.log(`☁️  [ImageStorage] Uploading to Firebase Storage: ${filename}`);

      const file = this.bucket.file(filename);
      await file.save(imageBuffer, {
        metadata: {
          contentType,
          metadata: {
            taskId,
            originalUrl: temporaryUrl,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filename}`;

      console.log(`✅ [ImageStorage] Image stored permanently`);
      console.log(`   URL: ${publicUrl}`);

      return publicUrl;
    } catch (error: any) {
      console.error(`❌ [ImageStorage] Failed to store image:`, error.message);

      // If download/upload fails, return the original temporary URL as fallback
      // (it might still work for a short time)
      console.warn(`⚠️  [ImageStorage] Falling back to temporary URL`);
      return temporaryUrl;
    }
  }

  /**
   * Stores multiple images permanently
   * @param temporaryUrls Array of temporary BFL image URLs
   * @param taskId The task ID
   * @returns Array of permanent Firebase Storage URLs
   */
  async storeImagesPermanently(temporaryUrls: string[], taskId: string): Promise<string[]> {
    console.log(`📥 [ImageStorage] Storing ${temporaryUrls.length} image(s) permanently...`);

    const permanentUrls = await Promise.all(
      temporaryUrls.map((url) => this.storeImagePermanently(url, taskId))
    );

    console.log(`✅ [ImageStorage] All images stored`);
    return permanentUrls;
  }

  /**
   * Get file extension from content type
   */
  private getExtensionFromContentType(contentType: string): string {
    const typeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };

    return typeMap[contentType.toLowerCase()] || '.jpg';
  }
}
