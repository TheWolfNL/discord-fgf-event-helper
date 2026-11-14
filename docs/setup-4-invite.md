---
layout: page
title: 4. Invite the bot and restrict the command
---

## Invite

1. In the Developer Portal, open **Installation** and copy the
   **Install Link**.
2. Open it, choose your server and click **Authorize**.
3. Make sure the bot can post in the event channel: the channel's
   permissions must allow the bot (or its role) **View Channel**,
   **Send Messages** and **Embed Links**.

## Restrict `/event` to a role

Out of the box only server administrators see `/event`. To let your event
admins use it:

1. Server Settings → **Integrations** → your app → **Manage**.
2. Under **Commands**, click `/event`.
3. Click **Add Roles or Members**, add the event admin role, and make sure it
   shows a green check.

If you set `ALLOWED_ROLE_ID` during deploy, the Worker also refuses anyone
without that role, as a second safety net.

## Try it

Type `/event` in any channel. See [Using `/event`](usage.md).

If the command doesn't show up, fully restart Discord (Ctrl/Cmd+R). If it
still doesn't, go back to [step 3](setup-3-connect.md) and click
**Save Changes** again; that re-registers the command.
