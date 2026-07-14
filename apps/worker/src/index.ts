import { env } from "./config.js";
import { scheduleBackgroundJobs } from "./jobs/index.js";

scheduleBackgroundJobs({ environment: env.NODE_ENV });
