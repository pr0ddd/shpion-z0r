/*
  Warnings:

  - You are about to drop the column `sfuHost` on the `servers` table. All the data in the column will be lost.
  - You are about to drop the column `sfuPort` on the `servers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "servers" DROP COLUMN "sfuHost",
DROP COLUMN "sfuPort",
ADD COLUMN     "sfuId" TEXT;

-- CreateTable
CREATE TABLE "sfu_servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "sfu_servers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_sfuId_fkey" FOREIGN KEY ("sfuId") REFERENCES "sfu_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
