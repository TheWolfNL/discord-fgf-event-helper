export type Trade = "keep" | "pause";
export type EventId = "arms-race" | "trade-route" | "shadow-front";

export interface Part {
  key: string;
  // Empty for single-part events.
  label: string;
  durationMin: number;
  banner: string;
}

export interface EventTemplate {
  id: EventId;
  name: string;
  description: string;
  trade: Trade;
  color: number;
  location: string;
  parts: Part[];
}

const LOCATION = "Foundation: Galactic Frontier";

export const EVENTS: Record<EventId, EventTemplate> = {
  "arms-race": {
    id: "arms-race",
    name: "Arms Race",
    description: "Arms Race runs in two parts. Be online for both parts to get the most out of it.",
    trade: "pause",
    color: 0x7b3f9c,
    location: LOCATION,
    parts: [
      { key: "a", label: "Part A", durationMin: 30, banner: "arms-race-a.png" },
      { key: "b", label: "Part B", durationMin: 30, banner: "arms-race-b.png" },
    ],
  },
  "trade-route": {
    id: "trade-route",
    name: "Defend the Trade Route",
    description: "Defend the Trade Route together with the alliance.",
    trade: "keep",
    color: 0x2f6ad0,
    location: LOCATION,
    parts: [{ key: "main", label: "", durationMin: 30, banner: "trade-route.png" }],
  },
  "shadow-front": {
    id: "shadow-front",
    name: "Shadow Front",
    description: "Shadow Front squad battle. Check with your squad lead which squad you are in.",
    trade: "keep",
    color: 0xb5621f,
    location: LOCATION,
    parts: [
      { key: "1", label: "Squad 1", durationMin: 30, banner: "shadow-front-1.png" },
      { key: "2", label: "Squad 2", durationMin: 30, banner: "shadow-front-2.png" },
    ],
  },
};

export const SHADOW_FRONT_SLOTS = ["12:00", "18:00", "23:00"] as const;

export function findPart(t: EventTemplate, key: string): Part | undefined {
  return t.parts.find((p) => p.key === key);
}

export function eventName(t: EventTemplate, p: Part): string {
  return p.label ? `${t.name} — ${p.label}` : t.name;
}
