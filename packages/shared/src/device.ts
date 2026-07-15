import { z } from "zod";

export const deviceModeSchema = z.enum(["SCAN", "ENROLL"]);

export const deviceHeartbeatSchema = z.object({
  activeEnrollmentSessionId: z.string().min(1).nullable().optional(),
  deviceId: z.string().min(1),
  firmwareVersion: z.string().optional(),
  ipAddress: z.string().optional(),
  reportedMode: deviceModeSchema
});

export const deviceHeartbeatResponseSchema = z.object({
  accepted: z.literal(true),
  cancelEnrollmentSessionId: z.string().min(1).nullable(),
  desiredMode: deviceModeSchema,
  deviceId: z.string().min(1),
  enrollment: z
    .object({
      expiresAt: z.iso.datetime(),
      sessionId: z.string().min(1)
    })
    .nullable(),
  lastSeenAt: z.iso.datetime()
});

export const deviceScanSchema = z.object({
  deviceId: z.string().min(1),
  scannerTemplateId: z.number().int().nonnegative(),
  deviceScanSequence: z.number().int().nonnegative().optional(),
  firmwareVersion: z.string().optional(),
  matchConfidence: z.number().min(0).max(1).optional()
});

const enrollmentResultBaseSchema = z.object({
  deviceId: z.string().min(1),
  enrollmentSessionId: z.string().min(1)
});

export const deviceEnrollmentResultSchema = z.discriminatedUnion("status", [
  enrollmentResultBaseSchema.extend({
    scannerTemplateId: z.number().int().nonnegative(),
    status: z.literal("SUCCEEDED")
  }),
  enrollmentResultBaseSchema.extend({
    message: z.string().min(1),
    status: z.literal("FAILED")
  }),
  enrollmentResultBaseSchema.extend({
    message: z.string().optional(),
    status: z.literal("CANCELLED")
  })
]);

export type DeviceMode = z.infer<typeof deviceModeSchema>;
export type DeviceHeartbeat = z.infer<typeof deviceHeartbeatSchema>;
export type DeviceHeartbeatResponse = z.infer<typeof deviceHeartbeatResponseSchema>;
export type DeviceScan = z.infer<typeof deviceScanSchema>;
export type DeviceEnrollmentResult = z.infer<typeof deviceEnrollmentResultSchema>;
