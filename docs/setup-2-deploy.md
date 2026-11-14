---
layout: page
title: 2. Deploy to Cloudflare
---

## Deploy

1. Click the button:

   [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TheWolfNL/discord-fgf-event-helper)

2. Sign in to Cloudflare, or create a free account.
3. Connect your GitHub account when asked. Cloudflare creates a copy of this
   repository in your GitHub account; that copy is what gets deployed.
4. Leave the build and deploy commands as they are (deploy command
   `npm run deploy`). If the form shows fields for the values below, you can
   fill them in here; otherwise add them afterwards (next section).
   Keep the project name `discord-fgf-event-helper` if you can. If you pick
   another name, change `name` in `wrangler.jsonc` in your copy to match, or
   later deploys fail.
5. Click **Create and deploy**.
6. When the deploy finishes, copy the Worker's URL. It looks like
   `https://discord-fgf-event-helper.<your-account>.workers.dev`. Opening it in a browser
   shows *FGF event announcer is running.*

Every push to the `main` branch of your copy now redeploys automatically.

## Add the settings

The Worker needs the values from step 1. Skip this if you already filled them
in on the deploy form.

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), open
   **Workers & Pages** → `discord-fgf-event-helper`.
2. Go to **Settings** → **Variables and Secrets** and click **Add**.
3. For each row below: set **Type** to **Secret**, enter the name exactly as
   shown, and paste the value.

   | Name | Value |
   |---|---|
   | `DISCORD_APPLICATION_ID` | Application ID |
   | `DISCORD_PUBLIC_KEY` | Public Key |
   | `DISCORD_BOT_TOKEN` | Bot token |
   | `EVENT_CHANNEL_ID` | Event channel ID |
   | `ALLOWED_ROLE_ID` | Role ID, or `-` to skip this check |

4. Click **Deploy** to apply them.

Do this before the next step: Discord can only verify the Worker once
`DISCORD_PUBLIC_KEY` is set.

Next: [Connect Discord to the Worker](setup-3-connect.md).
