import { describe, expect, it } from "vitest";
import { handleAutocomplete, handleCommand, handleComponent } from "../src/commands.ts";
import type { Interaction, InteractionOption } from "../src/discord.ts";
import { decodePostId, encodePostId, NOTE_FIELD, scheduledEventPayload } from "../src/render.ts";

// Saturday 14 Nov 2026, 15:10 UTC.
const now = new Date(Date.UTC(2026, 10, 14, 15, 10));
const origin = "https://fgf.example.workers.dev";
const env = { EVENT_CHANNEL_ID: "chan", ALLOWED_ROLE_ID: "role" } as unknown as Env;

function command(sub: string, opts: Record<string, string>, focused?: string): Interaction {
  const options: InteractionOption[] = Object.entries(opts).map(([name, value]) => ({
    name,
    type: 3,
    value,
    ...(name === focused ? { focused: true } : {}),
  }));
  return {
    type: 2,
    id: "1",
    application_id: "app",
    token: "tok",
    guild_id: "guild",
    member: { roles: ["role"] },
    data: { name: "event", options: [{ name: sub, type: 1, options }] },
  };
}

const data = (r: Record<string, unknown>) => r.data as any;

describe("autocomplete", () => {
  it("suggests dates", () => {
    const r = handleAutocomplete(command("trade-route", { date: "" }, "date"), now);
    expect(data(r).choices).toHaveLength(8);
  });
  it("suggests future times for the chosen day", () => {
    const r = handleAutocomplete(command("trade-route", { date: "2026-11-14", time: "" }, "time"), now);
    expect(data(r).choices[0].value).toBe("15:30");
  });
});

describe("handleCommand", () => {
  it("previews arms race with part B after reset", () => {
    const r = handleCommand(
      command("arms-race", { date: "2026-11-16", time: "20:00", "part-b": "reset", note: "Bring shields" }),
      env,
      origin,
      now,
    );
    const d = data(r);
    expect(d.flags).toBe(64);
    expect(d.content).toContain("Arms Race — Part A: Mon 16 Nov 20:00 UTC");
    expect(d.content).toContain("Arms Race — Part B: Tue 17 Nov 00:30 UTC");
    const embed = d.embeds[0];
    expect(embed.title).toBe("Arms Race");
    expect(embed.image.url).toBe(`${origin}/banners/arms-race-a.png`);
    expect(embed.fields.map((f: { name: string }) => f.name)).toEqual(["Part A", "Part B", "Trade routes", NOTE_FIELD]);
    expect(embed.fields[0].value).toContain("Mon 16 Nov 20:00 UTC");
    expect(d.components[0].components[0].custom_id).toMatch(/^post:arms-race:a@\d+,b@\d+$/);
  });

  it("previews shadow front on the coming Friday", () => {
    const d = data(handleCommand(command("shadow-front", { squad: "2", slot: "23:00" }), env, origin, now));
    expect(d.content).toContain("Shadow Front — Squad 2: Fri 20 Nov 23:00 UTC");
    expect(d.embeds[0].title).toBe("Shadow Front — Squad 2");
    expect(d.embeds[0].fields[0].name).toBe("Squad 2");
  });

  it("rejects past times", () => {
    const d = data(handleCommand(command("trade-route", { date: "today", time: "10:00" }), env, origin, now));
    expect(d.content).toContain("in the past");
  });

  it("rejects members without the role", () => {
    const i = command("trade-route", { date: "2026-11-15", time: "10:00" });
    i.member = { roles: [] };
    expect(data(handleCommand(i, env, origin, now)).content).toContain("role");
  });
});

describe("post id", () => {
  it("round-trips", () => {
    const d = data(handleCommand(command("trade-route", { date: "2026-11-15", time: "10:00" }), env, origin, now));
    const id = d.components[0].components[0].custom_id as string;
    const decoded = decodePostId(id)!;
    expect(encodePostId(decoded)).toBe(id);
    expect(decoded.slots[0]!.end.getTime() - decoded.slots[0]!.start.getTime()).toBe(30 * 60_000);
  });
  it("rejects garbage", () => {
    expect(decodePostId("post:nope:a@1")).toBeUndefined();
    expect(decodePostId("post:arms-race:z@1")).toBeUndefined();
  });
});

describe("scheduled event payload", () => {
  it("is external with an end time", () => {
    const decoded = decodePostId("post:shadow-front:1@1795640400")!;
    const p = scheduledEventPayload({ ...decoded, note: "hi" }, decoded.slots[0]!, "data:image/png;base64,AA==");
    expect(p.entity_type).toBe(3);
    expect(p.name).toBe("Shadow Front — Squad 1");
    expect(p.scheduled_end_time).toBe(new Date((1795640400 + 1800) * 1000).toISOString());
    expect(p.description).toContain("Keep trading: separate instance");
    expect(p.description).toContain("hi");
  });
});

describe("handleComponent", () => {
  const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
  it("cancels", () => {
    const i = { ...command("x", {}), type: 3, data: { custom_id: "cancel" } };
    expect(data(handleComponent(i, env, ctx, origin, now)).content).toContain("Cancelled");
  });
  it("refuses expired previews", () => {
    const i = { ...command("x", {}), type: 3, data: { custom_id: "post:trade-route:main@1000" } };
    expect(data(handleComponent(i, env, ctx, origin, now)).content).toContain("passed");
  });
  it("starts posting", () => {
    let queued = false;
    const c = { waitUntil: () => (queued = true) } as unknown as ExecutionContext;
    const i = { ...command("x", {}), type: 3, data: { custom_id: "post:trade-route:main@1795640400" } };
    expect(data(handleComponent(i, env, c, origin, now)).content).toBe("Posting…");
    expect(queued).toBe(true);
  });
});
