-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "orientation" TEXT NOT NULL DEFAULT 'horizontal',
ADD COLUMN     "shape" TEXT NOT NULL DEFAULT 'rectangular',
ADD COLUMN     "xPosition" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yPosition" INTEGER NOT NULL DEFAULT 0;
