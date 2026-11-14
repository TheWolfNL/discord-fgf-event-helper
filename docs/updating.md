---
layout: page
title: Updating to the latest version
---

Your deployment runs from your own copy of the repository on GitHub. To pull
in the latest version:

1. Open your copy on GitHub.
2. Click **Sync fork** → **Update branch**.

Cloudflare sees the new commit and redeploys within a minute or two. You can
follow it in the Cloudflare dashboard → **Workers & Pages** → `discord-fgf-event-helper` →
**Deployments**.

If GitHub doesn't show **Sync fork** (Cloudflare created a plain copy rather
than a fork), add the original repository as upstream and merge it:

```bash
git remote add upstream https://github.com/TheWolfNL/discord-fgf-event-helper.git
git pull upstream main
git push
```

## When the commands change

New events or options only show up in Discord after the command is
re-registered. Either:

- Developer Portal → your app → **General Information** → click
  **Save Changes** next to the Interactions Endpoint URL, or
- add `DISCORD_APPLICATION_ID` and `DISCORD_BOT_TOKEN` under the Worker's
  **Settings** → **Build** → **Build variables and secrets**. Every deploy
  then re-registers automatically.
