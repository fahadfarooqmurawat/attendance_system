import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const seedDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(seedDir, "../../../.env");

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() })
});
const devDeviceId = "esp32-dev-001";
const devDeviceSecret = getRequiredEnv("DEV_DEVICE_SECRET");

function hashDeviceSecret(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

function getRequiredEnv(name: "DATABASE_URL" | "DEV_DEVICE_SECRET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is required to seed the database. Create .env from .env.example or set ${name}.`
    );
  }

  return value;
}

function getDatabaseUrl() {
  return getRequiredEnv("DATABASE_URL");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The bundled seed creates development-only accounts and devices.");
  }

  await prisma.$transaction(async (tx) => {
    const owner = await tx.employee.upsert({
      create: {
        email: "owner@example.com",
        fullName: "Owner",
        isOwner: true,
        passwordHash: "dev-only-password-disabled"
      },
      update: {},
      where: {
        email: "owner@example.com"
      }
    });

    await tx.employee.upsert({
      create: {
        email: "hr@example.com",
        fullName: "HR Manager",
        isHr: true,
        managerId: owner.id,
        passwordHash: "dev-only-password-disabled"
      },
      update: {},
      where: {
        email: "hr@example.com"
      }
    });

    await tx.device.upsert({
      create: {
        apiKeyHash: hashDeviceSecret(devDeviceSecret),
        id: devDeviceId,
        location: "Development bench",
        name: "Development ESP32"
      },
      update: {
        apiKeyHash: hashDeviceSecret(devDeviceSecret),
        status: "ACTIVE"
      },
      where: {
        id: devDeviceId
      }
    });
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
