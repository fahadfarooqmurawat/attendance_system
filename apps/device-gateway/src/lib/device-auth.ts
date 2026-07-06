import type { NextFunction, Request, Response } from "express";

export function requireDeviceAuth(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header("x-device-id");
  const signature = req.header("x-device-signature");

  if (!deviceId || !signature) {
    res.status(401).json({ error: "missing_device_credentials" });
    return;
  }

  // Placeholder: verify deviceId + body HMAC with the device secret stored in PostgreSQL.
  next();
}
