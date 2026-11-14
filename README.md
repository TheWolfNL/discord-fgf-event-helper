# FGF Event Announcer

Discord app for Foundation: Galactic Frontier servers. `/event` lets event
admins announce Arms Race, Defend the Trade Route and Shadow Front by picking
day and UTC time from dropdowns. It posts an announcement with local-time
timestamps and creates Discord Scheduled Events with banners.

Runs free on Cloudflare Workers. No domain or credit card needed.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TheWolfNL/discord-fgf-event-helper)

**Setup guide and usage:** see [`docs/`](docs/index.md), published at
`https://thewolfnl.github.io/discord-fgf-event-helper/`.

## Development

```bash
npm install
npm test            # unit tests
npm run typecheck
npm run banners     # regenerate public/banners/
npm run dev         # local Worker, reads .dev.vars
npm run register    # register slash commands using .dev.vars
```

Design notes: [DESIGN.md](DESIGN.md).

## Publishing the docs

GitHub repository → **Settings** → **Pages** → Source **Deploy from a
branch**, branch `main`, folder `/docs`.

## Credits

Banner font: [Bebas Neue](https://github.com/dharmatype/Bebas-Neue), SIL Open
Font License (`tools/banners/fonts/OFL.txt`). Artwork from Foundation:
Galactic Frontier.
