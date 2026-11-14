import { describe, expect, it } from "vitest";
import {
  armsRacePartB,
  dateChoices,
  nextFriday,
  parseDate,
  parseTime,
  timeChoices,
  formatUtc,
} from "../src/time.ts";

// Saturday 14 Nov 2026, 15:10 UTC.
const now = new Date(Date.UTC(2026, 10, 14, 15, 10));

describe("dateChoices", () => {
  it("lists today plus 7 days", () => {
    const c = dateChoices(now);
    expect(c).toHaveLength(8);
    expect(c[0]).toEqual({ name: "Today (Sat 14 Nov)", value: "2026-11-14" });
    expect(c[1]).toEqual({ name: "Tomorrow (Sun 15 Nov)", value: "2026-11-15" });
    expect(c[7]).toEqual({ name: "Sat 21 Nov", value: "2026-11-21" });
  });
});

describe("parseDate", () => {
  it("accepts ISO values in range", () => {
    expect(parseDate("2026-11-16", now)?.toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
  it("accepts a unique typed label", () => {
    expect(parseDate("mon", now)?.toISOString()).toBe("2026-11-16T00:00:00.000Z");
    expect(parseDate("today", now)?.toISOString()).toBe("2026-11-14T00:00:00.000Z");
  });
  it("rejects out of range and ambiguous input", () => {
    expect(parseDate("2026-11-22", now)).toBeUndefined();
    expect(parseDate("2026-11-13", now)).toBeUndefined();
    expect(parseDate("sat", now)).toBeUndefined();
    expect(parseDate("nonsense", now)).toBeUndefined();
  });
});

describe("parseTime", () => {
  it.each([
    ["18:00", { h: 18, m: 0 }],
    ["18", { h: 18, m: 0 }],
    ["1830", { h: 18, m: 30 }],
    ["9.15", { h: 9, m: 15 }],
    ["18:00 UTC", { h: 18, m: 0 }],
  ])("parses %s", (input, want) => expect(parseTime(input)).toEqual(want));
  it.each(["24:00", "18:60", "noon", ""])("rejects %s", (input) => expect(parseTime(input)).toBeUndefined());
});

describe("timeChoices", () => {
  it("hides past slots for today", () => {
    const c = timeChoices(now, "2026-11-14", "");
    expect(c[0]?.value).toBe("15:30");
  });
  it("shows from midnight for later days, capped at 25", () => {
    const c = timeChoices(now, "2026-11-15", "");
    expect(c[0]?.value).toBe("00:00");
    expect(c).toHaveLength(25);
  });
  it("filters by typed hour", () => {
    expect(timeChoices(now, "2026-11-15", "18").map((c) => c.value)).toEqual(["18:00", "18:30"]);
  });
  it("offers a typed custom time", () => {
    expect(timeChoices(now, "2026-11-15", "18:15")[0]?.value).toBe("18:15");
  });
});

describe("armsRacePartB", () => {
  const a = new Date(Date.UTC(2026, 10, 20, 18, 0));
  it("immediate starts when A ends", () => {
    expect(formatUtc(armsRacePartB(a, 30, "immediate"))).toBe("Fri 20 Nov 18:30 UTC");
  });
  it("reset starts 00:30 the next day", () => {
    expect(formatUtc(armsRacePartB(a, 30, "reset"))).toBe("Sat 21 Nov 00:30 UTC");
  });
});

describe("nextFriday", () => {
  it("picks the coming Friday", () => {
    expect(formatUtc(nextFriday(now))).toBe("Fri 20 Nov 00:00 UTC");
  });
  it("skips to next week when today is Friday", () => {
    expect(formatUtc(nextFriday(new Date(Date.UTC(2026, 10, 20, 6))))).toBe("Fri 27 Nov 00:00 UTC");
  });
});
