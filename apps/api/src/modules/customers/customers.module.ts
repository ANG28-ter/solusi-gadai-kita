import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { FileUploadModule } from '../../common/file-upload/file-upload.module';

@Module({
  imports: [FileUploadModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule { }
