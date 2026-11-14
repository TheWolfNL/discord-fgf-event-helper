import { InteractionResponseFlags, InteractionResponseType } from "discord-interactions";
import {
  createMessage,
  createScheduledEvent,
  editOriginalResponse,
  type Interaction,
  type InteractionOption,
} from "./discord.ts";
import { EVENTS, SHADOW_FRONT_SLOTS, findPart } from "./events.ts";
import {
  announcementEmbed,
  bannerPath,
  decodePostId,
  NOTE_FIELD,
  previewMessage,
  scheduledEventPayload,
  slot,
  type Announcement,
} from "./render.ts";
import {
  armsRacePartB,
  at,
  dateChoices,
  filterChoices,
  formatUtc,
  nextFriday,
  parseDate,
  parseTime,
  timeChoices,
  type PartBMode,
} from "./time.ts";

const SUB_COMMAND = 1;
const STRING = 3;
const NOTE_MAX = 500;

const dateOption = { type: STRING, name: "date", description: "Day (UTC)", required: true, autocomplete: true };
const timeOption = { type: STRING, name: "time", description: "Start time in UTC", required: true, autocomplete: true };
const noteOption = { type: STRING, name: "note", description: "Optional extra text", required: false, max_length: NOTE_MAX };

export const COMMANDS = [
  {
    name: "event",
    description: "Announce an FGF event",
    type: 1,
    default_member_permissions: "0",
    contexts: [0],
    integration_types: [0],
    options: [
      {
        type: SUB_COMMAND,
        name: "arms-race",
        description: "Arms Race, Part A and Part B",
        options: [
          dateOption,
          timeOption,
          {
            type: STRING,
            name: "part-b",
            description: "When Part B starts",
            required: true,
            choices: [
              { name: "Immediately after Part A", value: "immediate" },
              { name: "After reset (00:30 UTC next day)", value: "reset" },
            ],
          },
          noteOption,
        ],
      },
      {
        type: SUB_COMMAND,
        name: "trade-route",
        description: "Defend the Trade Route",
        options: [dateOption, timeOption, noteOption],
      },
      {
        type: SUB_COMMAND,
        name: "shadow-front",
        description: "Shadow Front, on the coming Friday",
        options: [
          {
            type: STRING,
            name: "squad",
            description: "Squad",
            required: true,
            choices: EVENTS["shadow-front"].parts.map((p) => ({ name: p.label, value: p.key })),
          },
          {
            type: STRING,
            name: "slot",
            description: "Timeslot (UTC)",
            required: true,
            choices: SHADOW_FRONT_SLOTS.map((s) => ({ name: `${s} UTC`, value: s })),
          },
          noteOption,
        ],
      },
    ],
  },
];

type Response = Record<string, unknown>;

function ephemeral(content: string): Response {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: InteractionResponseFlags.EPHEMERAL },
  };
}

function subcommand(i: Interaction): { name: string; options: Map<string, InteractionOption> } | undefined {
  const sub = i.data?.options?.[0];
  if (!sub || sub.type !== SUB_COMMAND) return undefined;
  return { name: sub.name, options: new Map((sub.options ?? []).map((o) => [o.name, o])) };
}

function str(options: Map<string, InteractionOption>, name: string): string {
  const v = options.get(name)?.value;
  return typeof v === "string" ? v.trim() : "";
}

function allowed(i: Interaction, env: Env): boolean {
  const role = env.ALLOWED_ROLE_ID?.trim();
  // "-" because the deploy form may not accept an empty secret.
  return !role || role === "-" || (i.member?.roles ?? []).includes(role);
}

export function handleAutocomplete(i: Interaction, now: Date): Response {
  const sub = subcommand(i);
  const focused = sub ? [...sub.options.values()].find((o) => o.focused) : undefined;
  const typed = typeof focused?.value === "string" ? focused.value : "";
  let choices: { name: string; value: string }[] = [];
  if (sub && focused?.name === "date") choices = filterChoices(dateChoices(now), typed);
  if (sub && focused?.name === "time") choices = timeChoices(now, str(sub.options, "date") || undefined, typed);
  return { type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, data: { choices } };
}

function parseStart(options: Map<string, InteractionOption>, now: Date): Date | string {
  const day = parseDate(str(options, "date"), now);
  if (!day) return "Pick a date from the list (today or the next 7 days).";
  const time = parseTime(str(options, "time"));
  if (!time) return "Pick a time from the list, or type it as HH:MM (UTC).";
  const start = at(day, time);
  if (start <= now) return `${formatUtc(start)} is in the past.`;
  return start;
}

function buildAnnouncement(name: string, options: Map<string, InteractionOption>, now: Date): Announcement | string {
  const note = str(options, "note") || undefined;
  switch (name) {
    case "arms-race": {
      const t = EVENTS["arms-race"];
      const start = parseStart(options, now);
      if (typeof start === "string") return start;
      const [a, b] = t.parts;
      if (!a || !b) return "The Arms Race template needs two parts.";
      const mode: PartBMode = str(options, "part-b") === "reset" ? "reset" : "immediate";
      return { template: t, slots: [slot(a, start), slot(b, armsRacePartB(start, a.durationMin, mode))], note };
    }
    case "trade-route": {
      const t = EVENTS["trade-route"];
      const start = parseStart(options, now);
      if (typeof start === "string") return start;
      return { template: t, slots: [slot(t.parts[0]!, start)], note };
    }
    case "shadow-front": {
      const t = EVENTS["shadow-front"];
      const part = findPart(t, str(options, "squad"));
      const time = parseTime(str(options, "slot"));
      if (!part || !time) return "Pick a squad and a timeslot.";
      return { template: t, slots: [slot(part, at(nextFriday(now), time))], note };
    }
    default:
      return `Unknown event "${name}".`;
  }
}

export function handleCommand(i: Interaction, env: Env, origin: string, now: Date): Response {
  if (!allowed(i, env)) return ephemeral("You don't have the role needed to announce events.");
  const sub = subcommand(i);
  if (!sub) return ephemeral("Unknown command.");
  const a = buildAnnouncement(sub.name, sub.options, now);
  if (typeof a === "string") return ephemeral(a);
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { ...previewMessage(a, origin), flags: InteractionResponseFlags.EPHEMERAL },
  };
}

function update(content: string): Response {
  return { type: InteractionResponseType.UPDATE_MESSAGE, data: { content, embeds: [], components: [] } };
}

function noteFromPreview(i: Interaction): string | undefined {
  return i.message?.embeds?.[0]?.fields?.find((f) => f.name === NOTE_FIELD)?.value;
}

async function bannerDataUri(env: Env, origin: string, path: string): Promise<string> {
  const res = await env.ASSETS.fetch(`${origin}${path}`);
  if (!res.ok) throw new Error(`Banner ${path} not found (${res.status}).`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:image/png;base64,${btoa(binary)}`;
}

async function post(i: Interaction, env: Env, origin: string, a: Announcement): Promise<void> {
  const guildId = i.guild_id!;
  const channelId = env.EVENT_CHANNEL_ID.trim();
  try {
    const links: string[] = [];
    for (const s of a.slots) {
      const image = await bannerDataUri(env, origin, bannerPath(s.part));
      const ev = await createScheduledEvent(env, guildId, scheduledEventPayload(a, s, image));
      links.push(`https://discord.com/events/${guildId}/${ev.id}`);
    }
    const msg = await createMessage(env, channelId, {
      embeds: [announcementEmbed(a, origin, links)],
      allowed_mentions: { parse: [] },
    });
    await editOriginalResponse(i, {
      content: `Posted ✅ https://discord.com/channels/${guildId}/${msg.channel_id}/${msg.id}`,
    });
  } catch (err) {
    console.error(err);
    await editOriginalResponse(i, { content: `Posting failed: ${(err as Error).message}`.slice(0, 1900) }).catch(
      (e) => console.error(e),
    );
  }
}

export function handleComponent(
  i: Interaction,
  env: Env,
  ctx: ExecutionContext,
  origin: string,
  now: Date,
): Response {
  const id = i.data?.custom_id ?? "";
  if (id === "cancel") return update("Cancelled. Nothing was posted.");
  if (!allowed(i, env)) return ephemeral("You don't have the role needed to announce events.");
  if (!i.guild_id) return ephemeral("This only works inside a server.");
  if (!env.EVENT_CHANNEL_ID?.trim()) return update("EVENT_CHANNEL_ID is not configured. See the setup guide.");
  const decoded = decodePostId(id);
  if (!decoded) return update("This preview is no longer valid. Run the command again.");
  if (decoded.slots.some((s) => s.start <= now)) return update("The start time has passed. Run the command again.");
  const a: Announcement = { ...decoded, note: noteFromPreview(i) };
  ctx.waitUntil(post(i, env, origin, a));
  return update("Posting…");
}
