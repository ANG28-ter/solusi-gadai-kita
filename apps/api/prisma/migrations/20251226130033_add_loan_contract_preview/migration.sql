/*
  Warnings:

  - You are about to drop the column `userId` on the `LoanContract` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LoanContract" DROP CONSTRAINT "LoanContract_userId_fkey";

-- AlterTable
ALTER TABLE "LoanContract" DROP COLUMN "userId";
