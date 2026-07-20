import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

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
    // 1. Setup RBAC Roles and Permissions
    const rolesData = [
      { name: "employee", perms: ["my_attendance", "manual_reports"] },
      { name: "manager", perms: ["my_attendance", "manual_reports", "team_attendance", "approvals"] },
      { name: "hr", perms: ["my_attendance", "manual_reports", "enrollment", "reports"] },
      { name: "owner", perms: ["my_attendance", "manual_reports", "enrollment", "reports", "company_attendance"] }
    ];

    for (const p of [...new Set(rolesData.flatMap(r => r.perms))]) {
      await tx.permission.upsert({ create: { name: p }, update: {}, where: { name: p } });
    }

    const roles: Record<string, any> = {};
    for (const r of rolesData) {
      roles[r.name] = await tx.role.upsert({ create: { name: r.name }, update: {}, where: { name: r.name } });
      for (const p of r.perms) {
        const perm = await tx.permission.findUnique({ where: { name: p } });
        if (perm) {
          await tx.rolePermission.upsert({
            create: { roleId: roles[r.name].id, permissionId: perm.id },
            update: {},
            where: { roleId_permissionId: { roleId: roles[r.name].id, permissionId: perm.id } }
          });
        }
      }
    }

    // 2. Setup Employees with generic password123
    const defaultPasswordHash = hashSync("password123", 10);

    const owner = await tx.employee.upsert({
      create: {
        email: "owner@test.com",
        fullName: "Company Owner",
        roleId: roles["owner"].id,
        passwordHash: defaultPasswordHash
      },
      update: {},
      where: { email: "owner@test.com" }
    });

    const hr = await tx.employee.upsert({
      create: {
        email: "hr@test.com",
        fullName: "HR Manager",
        roleId: roles["hr"].id,
        managerId: owner.id,
        passwordHash: defaultPasswordHash
      },
      update: {},
      where: { email: "hr@test.com" }
    });
    
    const manager = await tx.employee.upsert({
      create: {
        email: "manager@test.com",
        fullName: "Team Manager",
        roleId: roles["manager"].id,
        managerId: owner.id,
        passwordHash: defaultPasswordHash
      },
      update: {},
      where: { email: "manager@test.com" }
    });
    
    await tx.employee.upsert({
      create: {
        email: "employee@test.com",
        fullName: "Regular Employee",
        roleId: roles["employee"].id,
        managerId: manager.id,
        passwordHash: defaultPasswordHash
      },
      update: {},
      where: { email: "employee@test.com" }
    });

    // 3. Setup Dev Device
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
