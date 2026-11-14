---
layout: page
title: Changing settings
---

Settings live in Cloudflare, not in the code, so changing them never needs a
code change and deploys never overwrite them.

1. Open the [Cloudflare dashboard](https://dash.cloudflare.com) →
   **Workers & Pages** → `fgf-events`.
2. Go to **Settings** → **Variables and Secrets**.
3. Click **Edit** next to the value, enter the new value, and click
   **Deploy**.

Values are stored as secrets, so Cloudflare does not show their current
value; you can only replace it.

| Name | What it does |
|---|---|
| `EVENT_CHANNEL_ID` | Channel announcements are posted in. The bot needs View Channel, Send Messages and Embed Links there. |
| `ALLOWED_ROLE_ID` | Only members with this role can use `/event`. `-` turns the check off (Discord's command permissions still apply). |
| `DISCORD_BOT_TOKEN` | Replace after resetting the token in the Developer Portal. |
| `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID` | Only change these if you switch to a different Discord application. |
