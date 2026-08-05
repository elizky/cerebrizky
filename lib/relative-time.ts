import { copy, fill } from "@/lib/copy";

const MS_DAY = 24 * 60 * 60 * 1000;

export function formatRelativeShort(date: Date, now = new Date()): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / MS_DAY
  );

  if (diffDays <= 0) return copy.time.today;
  if (diffDays === 1) return copy.time.yesterday;
  if (diffDays < 30) return fill(copy.time.daysAgo, { n: diffDays });
  if (diffDays < 60) return copy.time.monthAgo;
  return fill(copy.time.monthsAgo, { n: Math.floor(diffDays / 30) });
}
