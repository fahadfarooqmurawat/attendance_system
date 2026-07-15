-- Device state is reported through heartbeat responses; the generic command queue is removed.
CREATE TYPE "DeviceMode" AS ENUM ('SCAN', 'ENROLL');

ALTER TABLE "Device"
ADD COLUMN "reportedMode" "DeviceMode" NOT NULL DEFAULT 'SCAN',
ADD COLUMN "modeChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP TABLE "DeviceCommand";
DROP TYPE "DeviceCommandStatus";
DROP TYPE "DeviceCommandType";
