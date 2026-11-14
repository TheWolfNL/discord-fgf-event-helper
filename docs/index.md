---
layout: page
title: FGF Event Announcer
---

A Discord app that lets event admins announce Foundation: Galactic Frontier
events with one command. Admins pick the event, day and UTC time from
dropdowns. The app posts an announcement whose times show up in every
reader's own timezone, and creates a Discord Scheduled Event with a banner.

![Arms Race banner](https://raw.githubusercontent.com/TheWolfNL/discord-fgf-event-helper/main/public/banners/arms-race-a.png)

## Setting it up

Takes about 15 minutes. You need a Discord server where you are an admin, a
GitHub account and a free Cloudflare account. No credit card, no domain.

1. [Create the Discord application](setup-1-discord-app.md)
2. [Deploy to Cloudflare](setup-2-deploy.md)
3. [Connect Discord to the Worker](setup-3-connect.md)
4. [Invite the bot and restrict the command](setup-4-invite.md)

## After setup

- [Using `/event`](usage.md) (for event admins)
- [Changing settings](settings.md): event channel, role check
- [Updating to the latest version](updating.md)
- [Changing templates and banners](maintaining.md) (for maintainers)
