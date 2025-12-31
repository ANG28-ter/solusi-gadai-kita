import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20, // Limit to recent 20
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.update({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async create(userId: string, title: string, message: string, type: string = 'INFO', link?: string) {
        console.log(`[NotificationsService] Creating notification for user ${userId}: ${title}`);
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                link,
            },
        });
        console.log(`[NotificationsService] Notification created:`, notification.id);
        return notification;
    }
}
