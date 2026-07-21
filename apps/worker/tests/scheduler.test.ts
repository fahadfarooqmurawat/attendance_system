import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  info: vi.fn(),
  schedule: vi.fn()
}));

vi.mock("node-cron", () => ({
  default: { schedule: mocks.schedule }
}));

vi.mock("pino", () => ({
  default: vi.fn(() => ({ info: mocks.info }))
}));

import { scheduleBackgroundJobs } from "../src/jobs/index.js";

describe("scheduleBackgroundJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs startup context and schedules the recurring worker tick", () => {
    scheduleBackgroundJobs({ environment: "test" });

    expect(mocks.info).toHaveBeenCalledWith({ environment: "test" }, "worker started");
    expect(mocks.schedule).toHaveBeenCalledWith("* * * * *", expect.any(Function));
  });

  it("logs when the scheduled callback runs", () => {
    scheduleBackgroundJobs({ environment: "development" });
    const callback = mocks.schedule.mock.calls[0]?.[1] as (() => void) | undefined;

    expect(callback).toBeTypeOf("function");
    callback?.();

    expect(mocks.info).toHaveBeenCalledWith(
      "placeholder tick: scan for notifications, reminders, reports, and cleanup"
    );
  });
});
