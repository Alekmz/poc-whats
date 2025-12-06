-- CreateTable
CREATE TABLE "whatsapp_numbers" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "name" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "qrCode" TEXT,
    "inboxId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_numbers_instanceId_key" ON "whatsapp_numbers"("instanceId");
