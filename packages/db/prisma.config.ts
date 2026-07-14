import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const configDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(configDir, "../../.env");

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? ""
  }
});
