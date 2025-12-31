import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadService } from './file-upload.service';

@Module({
    imports: [
        MulterModule.register({
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    // Generate unique filename: timestamp-random-originalname
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    const nameWithoutExt = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
                    cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB max file size
            },
            fileFilter: (req, file, cb) => {
                // Only allow image files
                if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
                    return cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    ],
    providers: [FileUploadService],
    exports: [MulterModule, FileUploadService],
})
export class FileUploadModule { }
