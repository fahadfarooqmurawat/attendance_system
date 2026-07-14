import cron from "node-cron";
import pino from "pino";

const logger = pino({ name: "attendance-worker" });

export type BackgroundJobConfig = {
  environment: "development" | "production" | "test";
};

export function scheduleBackgroundJobs(config: BackgroundJobConfig) {
  logger.info({ environment: config.environment }, "worker started");

  cron.schedule("* * * * *", () => {
    logger.info("placeholder tick: scan for notifications, reminders, reports, and cleanup");
  });
}
