---
layout: page
title: 3. Connect Discord to the Worker
---

1. In the [Discord Developer Portal](https://discord.com/developers/applications),
   open your app → **General Information**.
2. Set **Interactions Endpoint URL** to your Worker URL followed by
   `/interactions`:

   ```
   https://fgf-events.<your-account>.workers.dev/interactions
   ```

3. Click **Save Changes**.

Discord checks the URL when you save. On that check the Worker also registers
the `/event` command, so there is no separate registration step.

## If saving fails

*"The specified interactions endpoint url could not be verified"* means the
Worker rejected Discord's check. Usually:

- `DISCORD_PUBLIC_KEY` is wrong or has extra spaces. Fix it in Cloudflare
  ([Changing settings](settings.md)) and save again.
- The URL is wrong. Open it without `/interactions` in a browser; it should
  say *FGF event announcer is running.*

Next: [Invite the bot and restrict the command](setup-4-invite.md).
