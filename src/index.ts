import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";
import { COMMANDS, handleAutocomplete, handleCommand, handleComponent } from "./commands.ts";
import { registerCommands, type Interaction } from "./discord.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function handleInteraction(req: Request, env: Env, ctx: ExecutionContext, origin: string): Promise<Response> {
  const signature = req.headers.get("X-Signature-Ed25519") ?? "";
  const timestamp = req.headers.get("X-Signature-Timestamp") ?? "";
  const body = await req.text();
  if (!(await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY))) {
    return new Response("Bad request signature", { status: 401 });
  }
  const i = JSON.parse(body) as Interaction;
  const now = new Date();
  switch (i.type) {
    case InteractionType.PING:
      // Discord pings when the endpoint URL is saved, which makes it a convenient moment to register commands.
      ctx.waitUntil(
        registerCommands(env.DISCORD_APPLICATION_ID, env.DISCORD_BOT_TOKEN, COMMANDS).catch((e) => console.error(e)),
      );
      return json({ type: InteractionResponseType.PONG });
    case InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE:
      return json(handleAutocomplete(i, now));
    case InteractionType.APPLICATION_COMMAND:
      return json(handleCommand(i, env, origin, now));
    case InteractionType.MESSAGE_COMPONENT:
      return json(handleComponent(i, env, ctx, origin, now));
    default:
      return json({ error: "unknown interaction type" }, 400);
  }
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "POST" && (url.pathname === "/" || url.pathname === "/interactions")) {
      return handleInteraction(req, env, ctx, url.origin);
    }
    if (req.method === "GET" && url.pathname === "/") {
      return new Response("FGF event announcer is running.\n");
    }
    return new Response("Not found\n", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
