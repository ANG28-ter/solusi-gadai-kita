import { Injectable } from '@nestjs/common';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoanCalculationService {
  calculate(input: {
    principalRp: number;
    startDate: Date;
    today?: Date;
  }) {
    const today = input.today ?? new Date();

    // Use startOfDay to ensure clean midnight-to-midnight comparison
    // This counts calendar days regardless of time
    // Dec 27 00:00 to Dec 29 23:59 = 2 days
    const startDay = startOfDay(input.startDate);
    const currentDay = startOfDay(today);

    const daysUsed = Math.max(
      differenceInCalendarDays(currentDay, startDay),
      1, // minimum 1 day
    );

    let interestRatePercent: number;
    let status: LoanStatus;

    if (daysUsed <= 15) {
      interestRatePercent = 5;
      status = LoanStatus.ACTIVE;
    } else if (daysUsed <= 30) {
      interestRatePercent = 10;
      status = LoanStatus.ACTIVE;
    } else {
      interestRatePercent = 10; // frozen
      status = LoanStatus.OVERDUE;
    }

    const interestAmountRp = Math.floor(
      (input.principalRp * interestRatePercent) / 100,
    );

    const totalDueRp = input.principalRp + interestAmountRp;

    return {
      daysUsed,
      interestRatePercent,
      interestAmountRp,
      principalRp: input.principalRp,
      totalDueRp,
      status,
      isOverdue: status === LoanStatus.OVERDUE,
    };
  }
}
