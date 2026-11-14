const API = "https://discord.com/api/v10";

export interface InteractionOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  focused?: boolean;
  options?: InteractionOption[];
}

export interface Embed {
  fields?: { name: string; value: string }[];
}

export interface Interaction {
  type: number;
  id: string;
  application_id: string;
  token: string;
  guild_id?: string;
  member?: { roles: string[] };
  data?: {
    name?: string;
    options?: InteractionOption[];
    custom_id?: string;
  };
  message?: { embeds?: Embed[] };
}

export class DiscordError extends Error {}

async function call<T>(token: string | undefined, method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bot ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new DiscordError(`Discord API ${method} ${path} failed (${res.status}): ${await res.text()}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function createMessage(env: Env, channelId: string, body: unknown) {
  return call<{ id: string; channel_id: string }>(env.DISCORD_BOT_TOKEN, "POST", `/channels/${channelId}/messages`, body);
}

export function createScheduledEvent(env: Env, guildId: string, body: unknown) {
  return call<{ id: string }>(env.DISCORD_BOT_TOKEN, "POST", `/guilds/${guildId}/scheduled-events`, body);
}

export function editOriginalResponse(i: Interaction, body: unknown) {
  return call(undefined, "PATCH", `/webhooks/${i.application_id}/${i.token}/messages/@original`, body);
}

export function registerCommands(appId: string, botToken: string, commands: unknown[]) {
  return call<unknown[]>(botToken, "PUT", `/applications/${appId}/commands`, commands);
}
