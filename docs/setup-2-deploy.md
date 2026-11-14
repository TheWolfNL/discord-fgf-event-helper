---
layout: page
title: 2. Deploy to Cloudflare
---

1. Click the button:

   [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TheWolfNL/discord-fgf-event-helper)

2. Sign in to Cloudflare, or create a free account.
3. Connect your GitHub account when asked. Cloudflare creates a copy of this
   repository in your GitHub account; that copy is what gets deployed.
4. Fill in the values from step 1:

   | Name | Value |
   |---|---|
   | `DISCORD_APPLICATION_ID` | Application ID |
   | `DISCORD_PUBLIC_KEY` | Public Key |
   | `DISCORD_BOT_TOKEN` | Bot token |
   | `EVENT_CHANNEL_ID` | Event channel ID |
   | `ALLOWED_ROLE_ID` | Role ID, or `-` to skip this check |

5. Leave the build and deploy commands as they are (deploy command
   `npm run deploy`) and click **Create and deploy**.
6. When the deploy finishes, copy the Worker's URL. It looks like
   `https://fgf-events.<your-account>.workers.dev`. Opening it in a browser
   shows *FGF event announcer is running.*

Every push to the `main` branch of your copy now redeploys automatically.

Next: [Connect Discord to the Worker](setup-3-connect.md).
