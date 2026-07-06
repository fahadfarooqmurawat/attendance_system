export function getHealthResponse() {
  return { ok: true, service: "device-gateway" } as const;
}
