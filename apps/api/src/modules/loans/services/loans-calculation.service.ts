import { Injectable } from '@nestjs/common';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoanCalculationService {
  calculate(input: {
    principalRp: number;
    startDate: Date;
    today?: Date;
    interestPaidSoFar?: number;  // Amount of interest already paid
    isInterestPaidBeforeDay16?: boolean; // NEW: check if interest was cleared early
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
    const isEarlyPaid = input.isInterestPaidBeforeDay16 ?? false;

    if (daysUsed <= 15) {
      interestRatePercent = 5;
      status = LoanStatus.ACTIVE;
    } else if (daysUsed <= 30) {
      // If paid off early (before day 16), keep rate at 5%
      interestRatePercent = isEarlyPaid ? 5 : 10;
      status = LoanStatus.ACTIVE;
    } else {
      // Even if overdue, if early payment was made, do we look at 5%?
      // "untuk hari ke 16 dan seterusnya bunga menjadi 0"
      // This implies the obligation is satisfied at 5%.
      interestRatePercent = isEarlyPaid ? 5 : 10;
      status = LoanStatus.OVERDUE;
    }

    // Calculate base interest based on days and rate
    const baseInterestAmountRp = Math.floor(
      (input.principalRp * interestRatePercent) / 100,
    );

    // Consider already paid interest
    const interestPaidSoFar = input.interestPaidSoFar ?? 0;
    const remainingInterest = Math.max(baseInterestAmountRp - interestPaidSoFar, 0);

    // If interest is fully paid, effective rate is 0% for display purposes
    // But we still return the total interest amount (what was paid)
    const effectiveInterestRate = remainingInterest === 0 ? 0 : interestRatePercent;

    const totalDueRp = input.principalRp + baseInterestAmountRp;

    return {
      daysUsed,
      interestRatePercent: effectiveInterestRate,  // 0% if fully paid
      interestAmountRp: baseInterestAmountRp,      // Total interest (base calculation)
      remainingInterestRp: remainingInterest,      // Unpaid interest
      principalRp: input.principalRp,
      totalDueRp,
      status,
      isOverdue: status === LoanStatus.OVERDUE,
    };
  }
}
