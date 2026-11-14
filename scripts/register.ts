import { existsSync, readFileSync } from "node:fs";
import { COMMANDS } from "../src/commands.ts";
import { registerCommands } from "../src/discord.ts";

const optional = process.argv.includes("--optional");

function devVars(): Record<string, string> {
  if (!existsSync(".dev.vars")) return {};
  return Object.fromEntries(
    readFileSync(".dev.vars", "utf8")
      .split("\n")
      .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1]!, m[2]!.replace(/^["']|["']$/g, "")]),
  );
}

const vars = devVars();
const appId = process.env.DISCORD_APPLICATION_ID || vars.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_BOT_TOKEN || vars.DISCORD_BOT_TOKEN;

if (!appId || !token) {
  const msg = "DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN are needed to register commands.";
  if (optional) {
    console.log(`Skipping command registration: ${msg}`);
    process.exit(0);
  }
  console.error(msg);
  process.exit(1);
}

const result = await registerCommands(appId, token, COMMANDS);
console.log(`Registered ${result.length} command(s).`);
