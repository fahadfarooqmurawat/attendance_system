import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

import { z } from "zod";

const configDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(configDir, "../../../.env");

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);
