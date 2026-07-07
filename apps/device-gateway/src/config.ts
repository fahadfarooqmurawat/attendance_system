import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DEVICE_SIGNATURE_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(300),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4001)
});

export const env = envSchema.parse(process.env);
