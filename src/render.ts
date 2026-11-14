import { eventName, EVENTS, findPart, type EventId, type EventTemplate, type Part } from "./events.ts";
import { addMinutes, formatUtc, formatHm, unix } from "./time.ts";

export interface Slot {
  part: Part;
  start: Date;
  end: Date;
}

export interface Announcement {
  template: EventTemplate;
  slots: Slot[];
  note?: string;
}

export const NOTE_FIELD = "📝 Note";
const SCHEDULED_DESCRIPTION_MAX = 1000;
const CUSTOM_ID_PREFIX = "post";

export function slot(part: Part, start: Date): Slot {
  return { part, start, end: addMinutes(start, part.durationMin) };
}

export function announcementTitle(a: Announcement): string {
  const only = a.slots.length === 1 ? a.slots[0] : undefined;
  return only ? eventName(a.template, only.part) : a.template.name;
}

export function tradeLine(a: Announcement): string {
  return a.template.trade === "keep"
    ? "✅ **Keep trading**: separate instance, no need to pause your trade routes."
    : "⛔ **Pause trade routes**: this event is not a separate instance.";
}

export function bannerPath(p: Part): string {
  return `/banners/${p.banner}`;
}

export function announcementEmbed(a: Announcement, origin: string, eventLinks: string[] = []) {
  const fields = a.slots.map((s) => {
    const t = unix(s.start);
    return { name: s.part.label || "Start", value: `<t:${t}:F> · <t:${t}:R>\n${formatUtc(s.start)}`, inline: false };
  });
  fields.push({ name: "Trade routes", value: tradeLine(a), inline: false });
  if (a.note) fields.push({ name: NOTE_FIELD, value: a.note, inline: false });
  if (eventLinks.length > 0) {
    const links = eventLinks.map((url, i) => `[${a.slots[i]?.part.label || "Event"}](${url})`).join(" · ");
    fields.push({ name: "🔗 Scheduled events", value: links, inline: false });
  }
  return {
    title: announcementTitle(a),
    description: a.template.description,
    color: a.template.color,
    fields,
    image: { url: `${origin}${bannerPath(a.slots[0]!.part)}` },
    footer: { text: "Times are shown in your local timezone." },
  };
}

export function scheduledEventPayload(a: Announcement, s: Slot, imageDataUri: string) {
  const plainTrade = tradeLine(a).replace(/\*\*/g, "");
  const description = [a.template.description, plainTrade, a.note].filter(Boolean).join("\n\n");
  return {
    name: eventName(a.template, s.part),
    privacy_level: 2,
    entity_type: 3,
    entity_metadata: { location: a.template.location },
    scheduled_start_time: s.start.toISOString(),
    scheduled_end_time: s.end.toISOString(),
    description: description.slice(0, SCHEDULED_DESCRIPTION_MAX),
    image: imageDataUri,
  };
}

export function encodePostId(a: Announcement): string {
  const slots = a.slots.map((s) => `${s.part.key}@${unix(s.start)}`).join(",");
  return `${CUSTOM_ID_PREFIX}:${a.template.id}:${slots}`;
}

export function decodePostId(id: string): Omit<Announcement, "note"> | undefined {
  const [prefix, eventId, slotList] = id.split(":");
  if (prefix !== CUSTOM_ID_PREFIX || !eventId || !slotList || !(eventId in EVENTS)) return undefined;
  const template = EVENTS[eventId as EventId];
  const slots: Slot[] = [];
  for (const entry of slotList.split(",")) {
    const [key, ts] = entry.split("@");
    const part = key ? findPart(template, key) : undefined;
    const seconds = Number(ts);
    if (!part || !Number.isFinite(seconds)) return undefined;
    slots.push(slot(part, new Date(seconds * 1000)));
  }
  return { template, slots };
}

export function previewMessage(a: Announcement, origin: string) {
  const lines = a.slots.map(
    (s) => `• ${eventName(a.template, s.part)}: ${formatUtc(s.start)} – ${formatHm(s.end)} UTC`,
  );
  return {
    content: [
      "**Preview.** Nothing is posted yet. Check the times, then press **Post**.",
      "",
      "**Scheduled events to create**",
      ...lines,
    ].join("\n"),
    embeds: [announcementEmbed(a, origin)],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: "Post", custom_id: encodePostId(a) },
          { type: 2, style: 2, label: "Cancel", custom_id: "cancel" },
        ],
      },
    ],
  };
}
