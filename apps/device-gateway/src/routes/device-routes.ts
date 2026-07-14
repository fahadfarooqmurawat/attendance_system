import { Router, type Response } from "express";
import { Prisma } from "@attendance/db";
import {
  deviceCommandAckSchema,
  deviceEnrollmentResultSchema,
  deviceHeartbeatSchema,
  deviceScanSchema
} from "@attendance/shared";

import { prisma } from "../db.js";
import { type AuthenticatedDevice, requireDeviceAuth } from "../lib/device-auth.js";

export const deviceRouter = Router();

deviceRouter.use(requireDeviceAuth);

deviceRouter.post("/heartbeat", async (req, res) => {
  const heartbeat = deviceHeartbeatSchema.parse(req.body);
  const device = getAuthenticatedDevice(res);

  if (heartbeat.deviceId !== device.id) {
    res.status(400).json({ error: "device_id_mismatch" });
    return;
  }

  const updatedDevice = await prisma.device.update({
    data: {
      firmwareVersion: heartbeat.firmwareVersion ?? device.firmwareVersion,
      lastSeenAt: new Date(),
      status: "ACTIVE"
    },
    select: {
      id: true,
      lastSeenAt: true
    },
    where: {
      id: device.id
    }
  });

  res
    .status(202)
    .json({ accepted: true, deviceId: updatedDevice.id, lastSeenAt: updatedDevice.lastSeenAt });
});

deviceRouter.post("/scans", async (req, res) => {
  const scan = deviceScanSchema.parse(req.body);
  const device = getAuthenticatedDevice(res);

  if (scan.deviceId !== device.id) {
    res.status(400).json({ error: "device_id_mismatch" });
    return;
  }

  const enrollment = await prisma.fingerprintEnrollment.findFirst({
    select: {
      employeeId: true
    },
    where: {
      deviceId: device.id,
      scannerTemplateId: scan.scannerTemplateId,
      status: "ACTIVE"
    }
  });

  const data = {
    deviceId: device.id,
    deviceScanSequence: scan.deviceScanSequence,
    employeeId: enrollment?.employeeId,
    firmwareVersion: scan.firmwareVersion,
    matchConfidence:
      scan.matchConfidence === undefined ? undefined : new Prisma.Decimal(scan.matchConfidence),
    rawPayload: scan as Prisma.InputJsonValue,
    scannerTemplateId: scan.scannerTemplateId
  } satisfies Prisma.ScanEventUncheckedCreateInput;

  try {
    const createdScan = await prisma.scanEvent.create({
      data,
      select: {
        employeeId: true,
        id: true
      }
    });

    res.status(202).json({
      accepted: true,
      duplicate: false,
      employeeId: createdScan.employeeId,
      scanEventId: createdScan.id,
      scannerTemplateId: scan.scannerTemplateId
    });
  } catch (error) {
    if (!isUniqueConstraintError(error) || scan.deviceScanSequence === undefined) {
      throw error;
    }

    const existingScan = await prisma.scanEvent.findFirst({
      select: {
        employeeId: true,
        id: true
      },
      where: {
        deviceId: device.id,
        deviceScanSequence: scan.deviceScanSequence
      }
    });

    res.status(202).json({
      accepted: true,
      duplicate: true,
      employeeId: existingScan?.employeeId ?? null,
      scanEventId: existingScan?.id ?? null,
      scannerTemplateId: scan.scannerTemplateId
    });
  }
});

deviceRouter.get("/commands", async (_req, res) => {
  const device = getAuthenticatedDevice(res);
  const now = new Date();

  await prisma.deviceCommand.updateMany({
    data: {
      status: "EXPIRED"
    },
    where: {
      deviceId: device.id,
      expiresAt: {
        lt: now
      },
      status: {
        in: ["PENDING", "CLAIMED"]
      }
    }
  });

  const pendingCommands = await prisma.deviceCommand.findMany({
    orderBy: {
      createdAt: "asc"
    },
    select: {
      expiresAt: true,
      id: true,
      payload: true,
      type: true
    },
    take: 10,
    where: {
      deviceId: device.id,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      status: "PENDING"
    }
  });

  if (pendingCommands.length > 0) {
    await prisma.deviceCommand.updateMany({
      data: {
        claimedAt: now,
        status: "CLAIMED"
      },
      where: {
        id: {
          in: pendingCommands.map((command) => command.id)
        },
        status: "PENDING"
      }
    });
  }

  res.status(200).json({
    commands: pendingCommands.map((command) => ({
      commandId: command.id,
      expiresAt: command.expiresAt,
      payload: command.payload,
      type: command.type
    }))
  });
});

deviceRouter.post("/commands/:commandId/ack", async (req, res) => {
  const acknowledgement = deviceCommandAckSchema.parse({
    ...req.body,
    commandId: req.params.commandId
  });
  const device = getAuthenticatedDevice(res);

  if (acknowledgement.deviceId !== device.id) {
    res.status(400).json({ error: "device_id_mismatch" });
    return;
  }

  const updatedCommand = await prisma.deviceCommand.updateMany({
    data: {
      acknowledgedAt: new Date(),
      errorMessage:
        acknowledgement.status === "FAILED"
          ? (acknowledgement.message ?? "Device reported failure")
          : null,
      status: acknowledgement.status
    },
    where: {
      deviceId: device.id,
      id: acknowledgement.commandId
    }
  });

  if (updatedCommand.count === 0) {
    res.status(404).json({ error: "command_not_found" });
    return;
  }

  res.status(202).json({ accepted: true, commandId: acknowledgement.commandId });
});

deviceRouter.post("/enrollment-result", async (req, res) => {
  const result = deviceEnrollmentResultSchema.parse(req.body);
  const device = getAuthenticatedDevice(res);

  if (result.deviceId !== device.id) {
    res.status(400).json({ error: "device_id_mismatch" });
    return;
  }

  const updatedEnrollment = await prisma.$transaction(async (tx) => {
    const enrollmentSession = await tx.enrollmentSession.findFirst({
      select: {
        employeeId: true,
        id: true
      },
      where: {
        deviceId: device.id,
        id: result.enrollmentSessionId
      }
    });

    if (!enrollmentSession) {
      return null;
    }

    if (result.status === "SUCCEEDED") {
      await tx.fingerprintEnrollment.upsert({
        create: {
          deviceId: device.id,
          employeeId: enrollmentSession.employeeId,
          scannerTemplateId: result.scannerTemplateId,
          status: "ACTIVE"
        },
        update: {
          enrolledAt: new Date(),
          revokedAt: null,
          scannerTemplateId: result.scannerTemplateId,
          status: "ACTIVE"
        },
        where: {
          employeeId_deviceId: {
            deviceId: device.id,
            employeeId: enrollmentSession.employeeId
          }
        }
      });
    }

    await tx.deviceCommand.updateMany({
      data: {
        acknowledgedAt: new Date(),
        errorMessage: result.status === "SUCCEEDED" ? null : result.message,
        status: result.status === "SUCCEEDED" ? "ACKNOWLEDGED" : "FAILED"
      },
      where: {
        enrollmentSessionId: enrollmentSession.id
      }
    });

    return tx.enrollmentSession.update({
      data: {
        completedAt: new Date(),
        errorMessage: result.status === "SUCCEEDED" ? null : result.message,
        scannerTemplateId: result.scannerTemplateId,
        status: result.status
      },
      select: {
        id: true,
        status: true
      },
      where: {
        id: enrollmentSession.id
      }
    });
  });

  if (!updatedEnrollment) {
    res.status(404).json({ error: "enrollment_session_not_found" });
    return;
  }

  res.status(202).json({
    accepted: true,
    enrollmentSessionId: updatedEnrollment.id,
    status: updatedEnrollment.status
  });
});

function getAuthenticatedDevice(res: Response) {
  return res.locals.device as AuthenticatedDevice;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
