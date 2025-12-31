import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityInterceptor } from './common/interceptors/activity.interceptor';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SystemModule } from './modules/system/system.module';
import { LoansModule } from './modules/loans/loans.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CashLedgerModule } from './modules/cashledger/cash-ledger.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CollateralModule } from './modules/collateral-item/collateral.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { ReportsModule } from './modules/loans/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { CompanyProfileModule } from './modules/company-profile/company-profile.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    SystemModule,
    LoansModule,
    CustomersModule,
    CashLedgerModule,
    PaymentsModule,
    CollateralModule,
    ContractsModule,
    ReportsModule,
    UsersModule,
    CompanyProfileModule,
    DashboardModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityInterceptor,
    },
  ],
})
export class AppModule { }
