import cron from "node-cron";
import pino from "pino";

const logger = pino({ name: "attendance-worker" });

export function scheduleBackgroundJobs() {
  logger.info("worker started");

  cron.schedule("* * * * *", () => {
    logger.info("placeholder tick: scan for notifications, reminders, reports, and cleanup");
  });
}
