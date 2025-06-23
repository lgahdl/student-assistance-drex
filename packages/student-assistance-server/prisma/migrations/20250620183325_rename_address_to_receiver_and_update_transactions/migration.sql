/*
  Warnings:

  - You are about to drop the column `processed` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_cpf_cnpj` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_name` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `addresses` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "processed",
DROP COLUMN "recipient_cpf_cnpj",
DROP COLUMN "recipient_name",
ADD COLUMN     "receiver_id" BIGINT,
ADD COLUMN     "student_id" BIGINT;

-- DropTable
DROP TABLE "addresses";

-- CreateTable
CREATE TABLE "receivers" (
    "id" BIGSERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "cpf_cnpj" TEXT,
    "type" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receivers_address_key" ON "receivers"("address");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
