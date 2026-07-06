import { Router } from "express";
import {
  deviceCommandAckSchema,
  deviceEnrollmentResultSchema,
  deviceHeartbeatSchema,
  deviceScanSchema
} from "@attendance/shared";

import { requireDeviceAuth } from "../lib/device-auth.js";

export const deviceRouter = Router();

deviceRouter.use(requireDeviceAuth);

deviceRouter.post("/heartbeat", (req, res) => {
  const heartbeat = deviceHeartbeatSchema.parse(req.body);
  res.status(202).json({ accepted: true, deviceId: heartbeat.deviceId });
});

deviceRouter.post("/scans", (req, res) => {
  const scan = deviceScanSchema.parse(req.body);
  res.status(202).json({ accepted: true, scannerTemplateId: scan.scannerTemplateId });
});

deviceRouter.get("/commands", (_req, res) => {
  res.status(200).json({ commands: [] });
});

deviceRouter.post("/commands/:commandId/ack", (req, res) => {
  const acknowledgement = deviceCommandAckSchema.parse({
    ...req.body,
    commandId: req.params.commandId
  });

  res.status(202).json({ accepted: true, commandId: acknowledgement.commandId });
});

deviceRouter.post("/enrollment-result", (req, res) => {
  const result = deviceEnrollmentResultSchema.parse(req.body);
  res.status(202).json({ accepted: true, enrollmentSessionId: result.enrollmentSessionId });
});
