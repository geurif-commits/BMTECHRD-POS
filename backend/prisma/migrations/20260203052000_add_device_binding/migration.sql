-- Add device binding fields
ALTER TABLE "businesses" ADD COLUMN "deviceId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "businesses_deviceId_key" ON "businesses"("deviceId");

ALTER TABLE "activation_requests" ADD COLUMN "deviceId" TEXT;
