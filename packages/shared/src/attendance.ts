import { z } from "zod";

export const manualAttendanceRequestTypeSchema = z.enum(["ADD_SCAN", "REMOVE_SCAN"]);
export type ManualAttendanceRequestType = z.infer<typeof manualAttendanceRequestTypeSchema>;

export const approvalStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "SKIPPED"]);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
