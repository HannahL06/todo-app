-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('TASK', 'NOTE', 'APPOINTMENT');

-- CreateEnum
CREATE TYPE "DailyItemStatus" AS ENUM ('UNTOUCHED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ItemType" NOT NULL DEFAULT 'TASK',
    "isRolling" BOOLEAN NOT NULL DEFAULT true,
    "scheduledDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "DailyItemStatus" NOT NULL DEFAULT 'UNTOUCHED',
    "notes" TEXT,
    "sortOrder" INTEGER,
    "removedFromToday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyItem_date_removedFromToday_sortOrder_idx" ON "DailyItem"("date", "removedFromToday", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DailyItem_itemId_date_key" ON "DailyItem"("itemId", "date");

-- AddForeignKey
ALTER TABLE "DailyItem" ADD CONSTRAINT "DailyItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
