import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
    constructor(private readonly prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user && user.id) {
            // Fire-and-forget update to avoid blocking the response
            this.prisma.user.update({
                where: { id: user.id },
                data: { lastActiveAt: new Date() },
            }).catch(err => {
                // Silently fail or log if needed, don't crash request
                // console.error('Failed to update lastActiveAt', err);
            });
        }

        return next.handle();
    }
}
