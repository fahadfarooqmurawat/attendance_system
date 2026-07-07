-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'DISABLED', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DeviceCommandStatus" AS ENUM ('PENDING', 'CLAIMED', 'ACKNOWLEDGED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DeviceCommandType" AS ENUM ('START_ENROLLMENT', 'CANCEL_ENROLLMENT', 'SYNC_CONFIG');

-- CreateEnum
CREATE TYPE "EnrollmentSessionStatus" AS ENUM ('PENDING', 'CLAIMED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FingerprintEnrollmentStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ManualAttendanceRequestType" AS ENUM ('ADD_SCAN', 'REMOVE_SCAN');

-- CreateEnum
CREATE TYPE "ManualAttendanceRequestStatus" AS ENUM ('PENDING_MANAGER', 'PENDING_HR', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ApproverKind" AS ENUM ('MANAGER', 'HR', 'OWNER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUESTED', 'APPROVAL_REMINDER', 'ATTENDANCE_ANOMALY', 'DEVICE_OFFLINE', 'ENROLLMENT_FAILED', 'REPORT_READY');

-- CreateEnum
CREATE TYPE "ReportExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employeeCode" TEXT,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "managerId" TEXT,
    "isHr" BOOLEAN NOT NULL DEFAULT false,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "apiKeyHash" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "firmwareVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FingerprintEnrollment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "scannerTemplateId" INTEGER NOT NULL,
    "status" "FingerprintEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "FingerprintEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentSession" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "requestedByEmployeeId" TEXT NOT NULL,
    "scannerTemplateId" INTEGER,
    "status" "EnrollmentSessionStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCommand" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "enrollmentSessionId" TEXT,
    "type" "DeviceCommandType" NOT NULL,
    "status" "DeviceCommandStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "claimedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "employeeId" TEXT,
    "scannerTemplateId" INTEGER NOT NULL,
    "deviceScanSequence" INTEGER,
    "firmwareVersion" TEXT,
    "matchConfidence" DECIMAL(5,4),
    "rawPayload" JSONB,
    "serverReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "workdays" INTEGER[],
    "graceMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeShiftAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualAttendanceRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdByEmployeeId" TEXT NOT NULL,
    "type" "ManualAttendanceRequestType" NOT NULL,
    "requestedTimestamp" TIMESTAMP(3),
    "targetScanEventId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ManualAttendanceRequestStatus" NOT NULL DEFAULT 'PENDING_MANAGER',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualAttendanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL,
    "manualAttendanceRequestId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "approverEmployeeId" TEXT NOT NULL,
    "approverKind" "ApproverKind" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "details" JSONB,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ReportExportStatus" NOT NULL DEFAULT 'PENDING',
    "parameters" JSONB NOT NULL,
    "filePath" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- CreateIndex
CREATE INDEX "Device_status_lastSeenAt_idx" ON "Device"("status", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "FingerprintEnrollment_deviceId_scannerTemplateId_key" ON "FingerprintEnrollment"("deviceId", "scannerTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "FingerprintEnrollment_employeeId_deviceId_key" ON "FingerprintEnrollment"("employeeId", "deviceId");

-- CreateIndex
CREATE INDEX "EnrollmentSession_deviceId_status_expiresAt_idx" ON "EnrollmentSession"("deviceId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "EnrollmentSession_employeeId_status_idx" ON "EnrollmentSession"("employeeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCommand_enrollmentSessionId_key" ON "DeviceCommand"("enrollmentSessionId");

-- CreateIndex
CREATE INDEX "DeviceCommand_deviceId_status_createdAt_idx" ON "DeviceCommand"("deviceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ScanEvent_employeeId_serverReceivedAt_idx" ON "ScanEvent"("employeeId", "serverReceivedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_deviceId_serverReceivedAt_idx" ON "ScanEvent"("deviceId", "serverReceivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScanEvent_deviceId_deviceScanSequence_key" ON "ScanEvent"("deviceId", "deviceScanSequence");

-- CreateIndex
CREATE INDEX "EmployeeShiftAssignment_employeeId_effectiveFrom_effectiveT_idx" ON "EmployeeShiftAssignment"("employeeId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "ManualAttendanceRequest_employeeId_createdAt_idx" ON "ManualAttendanceRequest"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "ManualAttendanceRequest_status_createdAt_idx" ON "ManualAttendanceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalStep_approverEmployeeId_status_idx" ON "ApprovalStep"("approverEmployeeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_manualAttendanceRequestId_sequence_key" ON "ApprovalStep"("manualAttendanceRequestId", "sequence");

-- CreateIndex
CREATE INDEX "Notification_employeeId_status_createdAt_idx" ON "Notification"("employeeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "JobRun_jobName_startedAt_idx" ON "JobRun"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "ReportExport_requestedById_createdAt_idx" ON "ReportExport"("requestedById", "createdAt");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FingerprintEnrollment" ADD CONSTRAINT "FingerprintEnrollment_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FingerprintEnrollment" ADD CONSTRAINT "FingerprintEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSession" ADD CONSTRAINT "EnrollmentSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSession" ADD CONSTRAINT "EnrollmentSession_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSession" ADD CONSTRAINT "EnrollmentSession_requestedByEmployeeId_fkey" FOREIGN KEY ("requestedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCommand" ADD CONSTRAINT "DeviceCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCommand" ADD CONSTRAINT "DeviceCommand_enrollmentSessionId_fkey" FOREIGN KEY ("enrollmentSessionId") REFERENCES "EnrollmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAttendanceRequest" ADD CONSTRAINT "ManualAttendanceRequest_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAttendanceRequest" ADD CONSTRAINT "ManualAttendanceRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAttendanceRequest" ADD CONSTRAINT "ManualAttendanceRequest_targetScanEventId_fkey" FOREIGN KEY ("targetScanEventId") REFERENCES "ScanEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approverEmployeeId_fkey" FOREIGN KEY ("approverEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_manualAttendanceRequestId_fkey" FOREIGN KEY ("manualAttendanceRequestId") REFERENCES "ManualAttendanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
