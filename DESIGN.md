# FGF Event Announcer — Design

Discord app that lets event admins of a Foundation: Galactic Frontier server
announce events without hand-writing `<t:…>` timestamp tags. Admins pick an
event, date and UTC time from dropdowns; the app posts an announcement (times
render in each reader's local timezone) and creates Discord Scheduled Events.

## Scope

**v1**
- `/event` slash command with one subcommand per event type.
- Private preview with **Post** / **Cancel** before anything goes public.
- Announcement embed in the configured event channel, with banner image.
- Discord Scheduled Event(s) per announcement, with cover image.
- Restricted to one role.
- Banner generator for event images.
- Setup/deploy guide published on GitHub Pages.

**Later** (design keeps room for these, not built now)
- Role pings.
- RSVPs and reminders.
- Repeating schedules (Cloudflare Cron Triggers).
- Voice channels per Shadow Front squad (scheduled event type switches from
  external to voice; config per event template).
- Arms Race A/B as two independent commands.
- Paths to Dominance, Operation Blackout.

## Architecture

```
Discord ──POST /interactions──▶ Cloudflare Worker (TypeScript)
                                  ├─ verify Ed25519 signature
                                  ├─ autocomplete: date / time suggestions
                                  ├─ command: build preview (ephemeral)
                                  └─ button "Post": create scheduled events,
                                     post announcement via Discord REST API
        ◀──GET /banners/*.png──── Worker static assets
```

- **Hosting:** Cloudflare Workers free tier, default `*.workers.dev` URL. No
  domain, no credit card.
- **Stateless:** no database. Button custom IDs carry the command parameters;
  the optional note is read back from the preview message.
- **3-second deadline:** the Post button replies with a deferred update, then
  does the API calls in `ctx.waitUntil` and edits the preview to
  "Posted ✓" with a link to the message (or the error).

## Commands

All times are UTC. Dropdowns are Discord autocomplete lists; the Worker
re-validates every value, since autocomplete does not enforce choices.

### `/event arms-race`
| Option | Type | Values |
|---|---|---|
| `date` | autocomplete | Today + next 7 days, e.g. `Today (Sat 14 Nov)`, `Sun 15 Nov` |
| `time` | autocomplete | 30-min steps `00:00`–`23:30` UTC; past times hidden when date is today; typing filters (`18` → `18:00`, `18:30`) |
| `part-b` | choice | `Immediately after A` / `After reset (00:30 UTC)` |
| `note` | text, optional | Free text added to announcement |

- Part A starts at `date time`.
- **Immediately after A:** Part B starts when A's estimated end is reached
  (A start + A duration).
- **After reset:** Part B starts at 00:30 UTC on the day after A's date.
- One announcement listing both parts; two scheduled events (Part A, Part B).

### `/event trade-route`
| Option | Type | Values |
|---|---|---|
| `date` | autocomplete | as above |
| `time` | autocomplete | as above |
| `note` | text, optional | |

One announcement, one scheduled event.

### `/event shadow-front`
| Option | Type | Values |
|---|---|---|
| `squad` | choice | `Squad 1` / `Squad 2` |
| `slot` | choice | `12:00` / `18:00` / `23:00` UTC |
| `note` | text, optional | |

- Date is always the next upcoming Friday, strictly after today (UTC). Run on
  a Friday, it schedules the Friday a week later.
- One announcement and one scheduled event per squad; both squads in the same
  slot means running the command twice.

### Preview
Ephemeral reply showing exactly the embed that will be posted, plus a summary
of the scheduled event(s) (name, start, end, in UTC and `<t:…>` local), and
**Post** / **Cancel** buttons.

## Event templates

Defined in code (`src/events.ts`). Changing text, durations or adding events
is a code change and redeploy.

| Event | Variants | Duration | Trade | Banner colours |
|---|---|---|---|---|
| Arms Race | Part A, Part B | 30 min each | Pause trade | Purple |
| Defend the Trade Route | — | 30 min | Keep trading (separate instance) | Blue |
| Shadow Front | Squad 1, Squad 2 | 30 min | Keep trading (separate instance) | Orange |

Per template: name, description (placeholder text for now), duration per
variant, trade flag, banner per variant, scheduled event location
(`Foundation: Galactic Frontier`), scheduled event type (external for all in
v1).

## Announcement message

Embed, posted after the scheduled events are created so it can link to them:

```
[banner image]
ARMS RACE
<description>

Part A   Sat 22 Nov 18:00 (in 3 days)      ← <t:…:F> (<t:…:R>)
         18:00 UTC
Part B   Sun 23 Nov 00:30 (in 3 days)
         00:30 UTC

⛔ Pause trade routes        /  ✅ Keep trading — separate instance
📝 <note, if given>
🔗 Scheduled events: Part A · Part B
```

## Scheduled events

- Type: external, location `Foundation: Galactic Frontier`.
- Name: `Arms Race — Part A`, `Defend the Trade Route`,
  `Shadow Front — Squad 1`.
- Start: as computed; end: start + template duration (Discord requires an
  end time for external events).
- Description: template description + trade line + note (max 1000 chars).
- Cover image: the variant's banner, uploaded as a data URI.

## Banners

1000×400 PNG (2.5:1, Discord's cover ratio), also used as the embed image.
Five variants: `arms-race-a`, `arms-race-b`, `trade-route`,
`shadow-front-1`, `shadow-front-2`.

```
┌──────────────────────────────────────────┐
│ ARMS RACE                 ░░artwork░░░░  │
│                         ░░░(ship)░░░░░░  │
│                         ░░░░░░░░░░░░░░░  │
│ [▣] PAUSE TRADE                 PART A   │
└──────────────────────────────────────────┘
```

- **Background:** dark-to-light gradient in colours sampled from the source
  artwork (purple / blue / orange).
- **Artwork:** ship region on the right, edges faded into the gradient
  (no true cutout). If transparent cutout PNGs are supplied later, they are
  used as-is. Shadow Front uses a larger part of its artwork.
- **Top left:** title, Bebas Neue.
- **Bottom left:** cube icon (redrawn as vector) on a tile + label;
  green tile/label `KEEP TRADING` or red tile/label `PAUSE TRADE`.
- **Bottom right:** `PART A` / `PART B` / `SQUAD 1` / `SQUAD 2`; none for
  Defend the Trade Route.
- **Generator:** `tools/banners` (Node + TypeScript) builds each banner as SVG
  and renders it with `@resvg/resvg-js`. Run locally, output committed to
  `public/banners/`. One sample banner is reviewed before generating all.

## Access control

- Command registered with `default_member_permissions: "0"`: only admins see
  it until a role is granted under Server Settings → Integrations.
- Optional `ALLOWED_ROLE_ID`: the Worker also rejects members without that
  role.

## Configuration

All stored as Worker secrets (declared in `.dev.vars.example`, prompted by
the deploy button) so deploys never overwrite them.

| Name | Purpose |
|---|---|
| `DISCORD_APPLICATION_ID` | App ID |
| `DISCORD_PUBLIC_KEY` | Request signature check |
| `DISCORD_BOT_TOKEN` | Post messages, create events, register commands |
| `EVENT_CHANNEL_ID` | The one event channel |
| `ALLOWED_ROLE_ID` | Extra role check; `-` disables it |

Bot permissions: View Channel, Send Messages, Embed Links, Create Events.

## Deployment

- **Deploy to Cloudflare button** in the README: copies the repo to the
  deployer's GitHub, prompts for the config values, sets up Workers Builds.
- Every push to `main` redeploys; copies update via GitHub "Sync fork".
- Command registration happens when Discord pings the Worker, which it does
  when the Interactions Endpoint URL is saved. The deploy command
  (`npm run deploy`) also registers if the app ID and bot token are added as
  optional build variables; without them it skips registration.
- Manual steps (covered in docs): create Discord app, deploy, paste Worker URL
  as Interactions Endpoint URL, invite bot, grant role.

## Docs site

`docs/` as Markdown, published with GitHub Pages (Jekyll default theme):
1. Create the Discord application.
2. Deploy to Cloudflare.
3. Connect Discord to the Worker.
4. Invite the bot and restrict the command to a role.
5. Set or change the event channel.
6. Using `/event` (for admins).
7. Changing templates and banners (for maintainers).

## Repository layout

```
discord-fgf/
├─ src/
│  ├─ index.ts          request routing
│  ├─ discord.ts        signature check, REST client
│  ├─ commands.ts       command definitions + handlers
│  ├─ events.ts         event templates
│  ├─ time.ts           date/time options, Part B and Friday logic
│  └─ render.ts         embed + scheduled event payloads
├─ scripts/register.ts  slash command registration
├─ tools/banners/       generator, source art, font
├─ public/banners/      generated PNGs
├─ test/                vitest: time logic, rendering
├─ docs/                GitHub Pages
├─ wrangler.jsonc
├─ package.json
└─ tsconfig.json
```

## Dependencies

`wrangler`, `typescript`, `discord-interactions`, `@resvg/resvg-js`,
`vitest`; Bebas Neue font (OFL).
