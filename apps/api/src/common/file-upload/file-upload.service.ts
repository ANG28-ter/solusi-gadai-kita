import { Injectable } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class FileUploadService {
    private readonly uploadDir = './uploads';

    /**
     * Generate file URL for accessing uploaded file
     */
    getFileUrl(filename: string): string {
        return `/uploads/${filename}`;
    }

    /**
     * Delete file from uploads directory
     */
    async deleteFile(filename: string): Promise<void> {
        try {
            const filePath = join(this.uploadDir, filename);

            // Check if file exists before deleting
            if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`✅ File deleted: ${filename}`);
            } else {
                console.warn(`⚠️ File not found: ${filename}`);
            }
        } catch (error) {
            console.error(`❌ Error deleting file ${filename}:`, error);
            // Don't throw error, just log it
        }
    }

    /**
     * Extract filename from URL
     * Example: /uploads/123456-photo.jpg -> 123456-photo.jpg
     */
    extractFilename(url: string): string | null {
        if (!url) return null;

        const match = url.match(/\/uploads\/(.+)$/);
        return match ? match[1] : null;
    }

    /**
     * Delete multiple files
     */
    async deleteFiles(filenames: string[]): Promise<void> {
        await Promise.all(filenames.map(filename => this.deleteFile(filename)));
    }

    /**
     * Extract filenames from URLs
     */
    extractFilenames(urls: string[]): string[] {
        return urls
            .map(url => this.extractFilename(url))
            .filter((filename): filename is string => filename !== null);
    }
}
