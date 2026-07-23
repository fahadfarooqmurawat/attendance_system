export type AttendanceScan = {
  id: string;
  occurredAt: Date;
};

export type AttendancePair = {
  checkIn: AttendanceScan;
  checkOut: AttendanceScan | null;
};

export type ScanType = "check-in" | "check-out" | "needs-review";

export type TaggedScan<T extends AttendanceScan = AttendanceScan> = T & {
  type: ScanType;
  label: string;
  reviewMessage?: string;
};

function formatScanTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function classifyDailyScans<T extends AttendanceScan>(
  scans: T[],
  dayName: string
): TaggedScan<T>[] {
  const sorted = [...scans].sort((left, right) => {
    return new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime();
  });

  const count = sorted.length;
  if (count === 0) {
    return [];
  }

  // 1 scan: Needs review
  if (count === 1) {
    const single = sorted[0]!;
    return [
      {
        ...single,
        type: "needs-review",
        label: "Needs Review",
        reviewMessage: `Only 1 scan on ${dayName} needs review that it is check in or check out`
      }
    ];
  }

  // Even scans: 1st is check in, 2nd is check out, 3rd is check in, 4th is check out, etc.
  if (count % 2 === 0) {
    return sorted.map((scan, index) => {
      const isCheckIn = index % 2 === 0;
      return {
        ...scan,
        type: isCheckIn ? "check-in" : "check-out",
        label: isCheckIn ? "Check In" : "Check Out"
      };
    });
  }

  // 3 scans: 1st is check in, 2nd needs review, 3rd is check out
  if (count === 3) {
    return [
      {
        ...sorted[0]!,
        type: "check-in",
        label: "Check In"
      },
      {
        ...sorted[1]!,
        type: "needs-review",
        label: "Needs Review",
        reviewMessage: `Scan on ${dayName} at ${formatScanTime(new Date(sorted[1]!.occurredAt))} needs review that it is check in or check out`
      },
      {
        ...sorted[2]!,
        type: "check-out",
        label: "Check Out"
      }
    ];
  }

  // 5 or any other odd scans: last 3rd scan needs review (index = count - 3)
  const reviewIndex = count - 3;
  return sorted.map((scan, index) => {
    if (index === reviewIndex) {
      const timeStr = formatScanTime(new Date(scan.occurredAt));
      return {
        ...scan,
        type: "needs-review",
        label: "Needs Review",
        reviewMessage: `Scan on ${dayName} at ${timeStr} needs review that it is check in or check out`
      };
    }

    if (index < reviewIndex) {
      const isCheckIn = index % 2 === 0;
      return {
        ...scan,
        type: isCheckIn ? "check-in" : "check-out",
        label: isCheckIn ? "Check In" : "Check Out"
      };
    } else {
      const offset = index - (reviewIndex + 1);
      const isCheckIn = offset % 2 === 0;
      return {
        ...scan,
        type: isCheckIn ? "check-in" : "check-out",
        label: isCheckIn ? "Check In" : "Check Out"
      };
    }
  });
}

export function pairScans(scans: AttendanceScan[]): AttendancePair[] {
  const orderedScans = [...scans].sort((left, right) => {
    return left.occurredAt.getTime() - right.occurredAt.getTime();
  });

  const pairs: AttendancePair[] = [];

  for (let index = 0; index < orderedScans.length; index += 2) {
    const checkIn = orderedScans[index];

    if (!checkIn) {
      continue;
    }

    pairs.push({
      checkIn,
      checkOut: orderedScans[index + 1] ?? null
    });
  }

  return pairs;
}

