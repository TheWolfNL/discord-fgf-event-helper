---
layout: page
title: 1. Create the Discord application
---

1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
   and click **New Application**. Name it, for example `FGF Events`. The name
   is what members see as the poster of announcements.
2. On **General Information**, copy and keep:
   - **Application ID**
   - **Public Key**
3. Open **Bot**, click **Reset Token**, confirm, and copy the token.
   Keep it secret: anyone with it can act as your bot. It is shown only once;
   if you lose it, reset it again.
   No privileged intents are needed; leave them off.
4. Open **Installation**:
   - **Installation Contexts**: keep **Guild Install** checked, uncheck
     **User Install**.
   - **Default Install Settings** → **Guild Install**:
     - Scopes: `applications.commands` and `bot`
     - Permissions: `View Channels`, `Send Messages`, `Embed Links`,
       `Create Events`
   - Click **Save Changes**.

Also turn on **Developer Mode** in your own Discord client (User Settings →
Advanced → Developer Mode). You need it to copy IDs:

5. Right-click the event channel → **Copy Channel ID**. Keep it.
6. Optional: right-click the role that may announce events (Server Settings →
   Roles) → **Copy Role ID**. Keep it.

You now have up to five values. Next: [Deploy to Cloudflare](setup-2-deploy.md).
