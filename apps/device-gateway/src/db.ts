import { createPrismaClient } from "@attendance/db";

import { env } from "./config.js";

export const prisma = createPrismaClient(env.DATABASE_URL);
