export interface Choice {
  name: string;
  value: string;
}

export interface HourMinute {
  h: number;
  m: number;
}

export type PartBMode = "immediate" | "reset";

export const DATE_RANGE_DAYS = 8;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const FRIDAY = 5;
const RESET_START: HourMinute = { h: 0, m: 30 };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * MINUTE_MS);
}

export function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function formatDay(d: Date): string {
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function formatHm(d: Date): string {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function formatUtc(d: Date): string {
  return `${formatDay(d)} ${formatHm(d)} UTC`;
}

export function unix(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}

export function at(day: Date, t: HourMinute): Date {
  return new Date(day.getTime() + (t.h * 60 + t.m) * MINUTE_MS);
}

export function dateChoices(now: Date): Choice[] {
  const today = startOfUtcDay(now);
  return Array.from({ length: DATE_RANGE_DAYS }, (_, i) => {
    const d = new Date(today.getTime() + i * DAY_MS);
    const label = i === 0 ? `Today (${formatDay(d)})` : i === 1 ? `Tomorrow (${formatDay(d)})` : formatDay(d);
    return { name: label, value: isoDate(d) };
  });
}

export function filterChoices(choices: Choice[], typed: string): Choice[] {
  const q = typed.trim().toLowerCase();
  if (q === "") return choices;
  return choices.filter((c) => c.name.toLowerCase().includes(q) || c.value.toLowerCase().includes(q));
}

// Accepts an ISO value from autocomplete or typed text matching a suggestion's label.
export function parseDate(input: string, now: Date): Date | undefined {
  const choices = dateChoices(now);
  const q = input.trim().toLowerCase();
  const match =
    choices.find((c) => c.value === q) ??
    choices.find((c) => c.name.toLowerCase() === q) ??
    (filterChoices(choices, q).length === 1 ? filterChoices(choices, q)[0] : undefined);
  if (!match) return undefined;
  const [y, mo, d] = match.value.split("-").map(Number);
  return new Date(Date.UTC(y!, mo! - 1, d!));
}

export function parseTime(input: string): HourMinute | undefined {
  const s = input.trim().toLowerCase().replace(/\s*utc$/, "");
  const m = /^(\d{1,2})(?:[:.h]?(\d{2}))?$/.exec(s);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  if (h > 23 || min > 59) return undefined;
  return { h, m: min };
}

export function timeChoices(now: Date, date: string | undefined, typed: string): Choice[] {
  const day = date ? parseDate(date, now) : undefined;
  const slots: Choice[] = [];
  for (let i = 0; i < 48; i++) {
    const t = { h: Math.floor(i / 2), m: (i % 2) * 30 };
    if (day && at(day, t) <= now) continue;
    const v = `${pad(t.h)}:${pad(t.m)}`;
    slots.push({ name: `${v} UTC`, value: v });
  }
  const q = typed.trim().replace(/\s*utc$/i, "");
  if (q === "") return slots.slice(0, 25);
  const digits = q.replace(/\D/g, "");
  const filtered = slots.filter((c) => c.value.startsWith(q) || c.value.replace(":", "").startsWith(digits));
  const exact = parseTime(q);
  if (exact && q.length >= 4) {
    const v = `${pad(exact.h)}:${pad(exact.m)}`;
    if (!filtered.some((c) => c.value === v) && !(day && at(day, exact) <= now)) {
      filtered.unshift({ name: `${v} UTC`, value: v });
    }
  }
  return filtered.slice(0, 25);
}

export function armsRacePartB(aStart: Date, aDurationMin: number, mode: PartBMode): Date {
  if (mode === "immediate") return addMinutes(aStart, aDurationMin);
  return at(new Date(startOfUtcDay(aStart).getTime() + DAY_MS), RESET_START);
}

// Always strictly after today, so running it on a Friday targets the following week.
export function nextFriday(now: Date): Date {
  const today = startOfUtcDay(now);
  const delta = (FRIDAY - today.getUTCDay() + 7) % 7 || 7;
  return new Date(today.getTime() + delta * DAY_MS);
}
