/*
  Warnings:

  - You are about to drop the column `user_id` on the `students` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_user_id_fkey";

-- DropIndex
DROP INDEX "students_user_id_key";

-- AlterTable
ALTER TABLE "receivers" ADD COLUMN     "registered_by" TEXT;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "user_id";

-- AddForeignKey
ALTER TABLE "receivers" ADD CONSTRAINT "receivers_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "students"("wallet_address") ON DELETE SET NULL ON UPDATE CASCADE;
