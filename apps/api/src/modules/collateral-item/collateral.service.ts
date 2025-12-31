import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../common/file-upload/file-upload.service';
import { CreateCollateralDto } from './dto/create-collateral.dto';

@Injectable()
export class CollateralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  async create(input: CreateCollateralDto, branchId: string) {
    return this.prisma.collateralItem.create({
      data: {
        name: input.name,
        description: input.description,
        estimatedValueRp: input.estimatedValueRp,
        branchId, // Branch ownership
      },
    });
  }

  async uploadPhotos(
    collateralId: string,
    files: Express.Multer.File[],
    branchId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const collateral = await this.prisma.collateralItem.findUnique({
      where: { id: collateralId },
      select: { id: true, branchId: true, photoUrls: true },
    });

    if (!collateral) {
      throw new NotFoundException('Collateral not found');
    }

    // Branch validation
    if (collateral.branchId !== branchId) {
      throw new ForbiddenException('Collateral not found in your branch');
    }

    const currentPhotos = collateral.photoUrls || [];
    const newPhotoUrls = files.map(file =>
      this.fileUploadService.getFileUrl(file.filename)
    );

    // Combine and limit to max 3 photos
    const allPhotos = [...currentPhotos, ...newPhotoUrls].slice(0, 3);

    // If we're over the limit, delete the excess uploaded files
    if (currentPhotos.length + newPhotoUrls.length > 3) {
      const excessFiles = files.slice(3 - currentPhotos.length);
      for (const file of excessFiles) {
        await this.fileUploadService.deleteFile(file.filename);
      }
    }

    return this.prisma.collateralItem.update({
      where: { id: collateralId },
      data: { photoUrls: allPhotos },
      select: {
        id: true,
        name: true,
        photoUrls: true,
      },
    });
  }

  async deletePhoto(
    collateralId: string,
    photoIndex: number,
    branchId: string,
  ) {
    const collateral = await this.prisma.collateralItem.findUnique({
      where: { id: collateralId },
      select: { id: true, branchId: true, photoUrls: true },
    });

    if (!collateral) {
      throw new NotFoundException('Collateral not found');
    }

    // Branch validation
    if (collateral.branchId !== branchId) {
      throw new ForbiddenException('Collateral not found in your branch');
    }

    const photoUrls = collateral.photoUrls || [];

    if (photoIndex < 0 || photoIndex >= photoUrls.length) {
      throw new BadRequestException('Invalid photo index');
    }

    const photoUrl = photoUrls[photoIndex];
    const filename = this.fileUploadService.extractFilename(photoUrl);
    if (filename) {
      await this.fileUploadService.deleteFile(filename);
    }

    // Remove photo from array
    const newPhotoUrls = photoUrls.filter((_, i) => i !== photoIndex);

    return this.prisma.collateralItem.update({
      where: { id: collateralId },
      data: { photoUrls: newPhotoUrls },
      select: {
        id: true,
        name: true,
        photoUrls: true,
      },
    });
  }

  async listDraft(branchId?: string) {
    // Return all collateral items (not just drafts)
    // Include loan relation to show status
    const where: any = {};

    // Filter by collateral's own branchId (not loan's branch)
    if (branchId) {
      where.branchId = branchId;
    }

    return this.prisma.collateralItem.findMany({
      where,
      include: {
        loan: {
          select: {
            id: true,
            code: true,
            status: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                code: true,
              },
            },
            auction: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignToLoan(collateralIds: string[], loanId: string) {
    if (!collateralIds.length) {
      throw new BadRequestException('CollateralIds tidak boleh kosong');
    }

    const result = await this.prisma.collateralItem.updateMany({
      where: {
        id: { in: collateralIds },
        loanId: null,
      },
      data: {
        loanId,
      },
    });

    if (result.count !== collateralIds.length) {
      throw new BadRequestException(
        'Sebagian collateral sudah terpakai atau tidak ditemukan',
      );
    }

    return result;
  }

  async findOne(id: string) {
    const collateral = await this.prisma.collateralItem.findUnique({
      where: { id },
      include: {
        loan: {
          select: {
            id: true,
            code: true,
            status: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                code: true,
              },
            },
            auction: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!collateral) {
      throw new NotFoundException(`Collateral dengan ID ${id} tidak ditemukan`);
    }

    return collateral;
  }

  async delete(id: string) {
    // Check if exists
    const collateral = await this.findOne(id);

    // Check if attached to a loan
    // Check if attached to a loan
    if (collateral.loanId) {
      const loanStatus = collateral.loan?.status;
      if (loanStatus !== 'LUNAS' && loanStatus !== 'CLOSED') {
        throw new BadRequestException(
          'Tidak bisa menghapus barang jaminan yang sedang digunakan pada gadai aktif',
        );
      }
    }

    // Delete all photos before deleting collateral
    if (collateral.photoUrls && collateral.photoUrls.length > 0) {
      const filenames = this.fileUploadService.extractFilenames(collateral.photoUrls);
      await this.fileUploadService.deleteFiles(filenames);
    }

    await this.prisma.collateralItem.delete({
      where: { id },
    });

    return { message: 'Barang jaminan berhasil dihapus' };
  }
}
