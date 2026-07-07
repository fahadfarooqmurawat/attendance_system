import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() })
});
const devDeviceId = "esp32-dev-001";

function hashDeviceSecret(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  return databaseUrl;
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
        apiKeyHash: hashDeviceSecret(process.env.DEV_DEVICE_SECRET ?? "dev-device-secret"),
        id: devDeviceId,
        location: "Development bench",
        name: "Development ESP32"
      },
      update: {
        apiKeyHash: hashDeviceSecret(process.env.DEV_DEVICE_SECRET ?? "dev-device-secret"),
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
