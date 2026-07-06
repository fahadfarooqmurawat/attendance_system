export type AttendanceScan = {
  id: string;
  occurredAt: Date;
};

export type AttendancePair = {
  checkIn: AttendanceScan;
  checkOut: AttendanceScan | null;
};

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
