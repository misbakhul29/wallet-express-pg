/*
  Warnings:

  - You are about to drop the column `walletId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sourceWalletId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceWalletType` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "walletId",
ADD COLUMN     "codiWalletId" TEXT,
ADD COLUMN     "dodiWalletId" TEXT,
ADD COLUMN     "dudiWalletId" TEXT,
ADD COLUMN     "receiverWalletType" TEXT,
ADD COLUMN     "senderWalletType" TEXT,
ADD COLUMN     "sourceWalletId" TEXT NOT NULL,
ADD COLUMN     "sourceWalletType" TEXT NOT NULL;

-- DropTable
DROP TABLE "Wallet";

-- CreateTable
CREATE TABLE "DodiWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "DodiWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DudiWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "DudiWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodiWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "CodiWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DodiWallet_userId_key" ON "DodiWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DudiWallet_userId_key" ON "DudiWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CodiWallet_userId_key" ON "CodiWallet"("userId");

-- AddForeignKey
ALTER TABLE "DodiWallet" ADD CONSTRAINT "DodiWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DudiWallet" ADD CONSTRAINT "DudiWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodiWallet" ADD CONSTRAINT "CodiWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_dodiWalletId_fkey" FOREIGN KEY ("dodiWalletId") REFERENCES "DodiWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_dudiWalletId_fkey" FOREIGN KEY ("dudiWalletId") REFERENCES "DudiWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_codiWalletId_fkey" FOREIGN KEY ("codiWalletId") REFERENCES "CodiWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
