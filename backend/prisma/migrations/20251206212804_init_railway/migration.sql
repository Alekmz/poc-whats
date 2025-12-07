-- CreateTable
CREATE TABLE "bot_flows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsappNumberId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "initialMessage" TEXT NOT NULL,
    "menuSteps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_sessions" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "botFlowId" TEXT NOT NULL,
    "currentStep" TEXT,
    "context" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conversationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bot_sessions_phoneNumber_idx" ON "bot_sessions"("phoneNumber");

-- CreateIndex
CREATE INDEX "bot_sessions_botFlowId_idx" ON "bot_sessions"("botFlowId");

-- CreateIndex
CREATE UNIQUE INDEX "bot_sessions_phoneNumber_botFlowId_isActive_key" ON "bot_sessions"("phoneNumber", "botFlowId", "isActive");

-- AddForeignKey
ALTER TABLE "bot_flows" ADD CONSTRAINT "bot_flows_whatsappNumberId_fkey" FOREIGN KEY ("whatsappNumberId") REFERENCES "whatsapp_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_sessions" ADD CONSTRAINT "bot_sessions_botFlowId_fkey" FOREIGN KEY ("botFlowId") REFERENCES "bot_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
