import { z } from "zod";

export const deviceHeartbeatSchema = z.object({
  deviceId: z.string().min(1),
  firmwareVersion: z.string().optional(),
  ipAddress: z.string().optional()
});

export const deviceScanSchema = z.object({
  deviceId: z.string().min(1),
  scannerTemplateId: z.number().int().nonnegative(),
  deviceScanSequence: z.number().int().nonnegative().optional(),
  firmwareVersion: z.string().optional(),
  matchConfidence: z.number().min(0).max(1).optional()
});

export const deviceCommandAckSchema = z.object({
  commandId: z.string().min(1),
  deviceId: z.string().min(1),
  status: z.enum(["ACKNOWLEDGED", "FAILED"]),
  message: z.string().optional()
});

export const deviceEnrollmentResultSchema = z.object({
  deviceId: z.string().min(1),
  enrollmentSessionId: z.string().min(1),
  scannerTemplateId: z.number().int().nonnegative(),
  status: z.enum(["SUCCEEDED", "FAILED", "CANCELLED"]),
  message: z.string().optional()
});

export type DeviceHeartbeat = z.infer<typeof deviceHeartbeatSchema>;
export type DeviceScan = z.infer<typeof deviceScanSchema>;
export type DeviceCommandAck = z.infer<typeof deviceCommandAckSchema>;
export type DeviceEnrollmentResult = z.infer<typeof deviceEnrollmentResultSchema>;
