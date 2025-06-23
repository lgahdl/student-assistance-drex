/*
  Warnings:

  - The primary key for the `receivers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `receivers` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `spending_limits` table. All the data in the column will be lost.
  - The primary key for the `students` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_address,expense_type_id]` on the table `spending_limits` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `student_address` to the `spending_limits` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "spending_limits" DROP CONSTRAINT "spending_limits_student_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_student_id_fkey";

-- DropIndex
DROP INDEX "receivers_address_key";

-- DropIndex
DROP INDEX "spending_limits_student_id_expense_type_id_key";

-- DropIndex
DROP INDEX "students_wallet_address_key";

-- AlterTable
ALTER TABLE "receivers" DROP CONSTRAINT "receivers_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "receivers_pkey" PRIMARY KEY ("address");

-- AlterTable
ALTER TABLE "spending_limits" DROP COLUMN "student_id",
ADD COLUMN     "student_address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP CONSTRAINT "students_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "students_pkey" PRIMARY KEY ("wallet_address");

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "receiver_id",
DROP COLUMN "student_id",
ADD COLUMN     "receiver_address" TEXT,
ADD COLUMN     "student_address" TEXT;

-- CreateTable
CREATE TABLE "receiver_expense_types" (
    "receiver_address" TEXT NOT NULL,
    "expense_type_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receiver_expense_types_pkey" PRIMARY KEY ("receiver_address","expense_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spending_limits_student_address_expense_type_id_key" ON "spending_limits"("student_address", "expense_type_id");

-- AddForeignKey
ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_student_address_fkey" FOREIGN KEY ("student_address") REFERENCES "students"("wallet_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_student_address_fkey" FOREIGN KEY ("student_address") REFERENCES "students"("wallet_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_address_fkey" FOREIGN KEY ("receiver_address") REFERENCES "receivers"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiver_expense_types" ADD CONSTRAINT "receiver_expense_types_receiver_address_fkey" FOREIGN KEY ("receiver_address") REFERENCES "receivers"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiver_expense_types" ADD CONSTRAINT "receiver_expense_types_expense_type_id_fkey" FOREIGN KEY ("expense_type_id") REFERENCES "expense_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
