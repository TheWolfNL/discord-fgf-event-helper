// 1000x400 matches Discord's 2.5:1 scheduled event cover ratio.
import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../../public/banners");
const fontFile = join(here, "fonts/BebasNeue-Regular.ttf");

const W = 1000;
const H = 400;
const MARGIN = 40;
const CREAM = "#f5efd6";
const FONT = "Bebas Neue";

type Trade = "keep" | "pause";

interface Art {
  file: string;
  // Placement of the scaled source image on the canvas.
  x: number;
  y: number;
  width: number;
  height: number;
  // Canvas x range over which the art fades in from the left.
  fadeFrom: number;
  fadeTo: number;
}

interface Theme {
  dark: string;
  light: string;
  art: Art;
}

interface Banner {
  name: string;
  title: string[];
  theme: Theme;
  trade: Trade;
  variant?: string;
}

const purple: Theme = {
  dark: "#1d0b2e",
  light: "#7b3f9c",
  art: { file: "arms-race.png", x: -491, y: 0, width: 1491, height: 400, fadeFrom: 380, fadeTo: 640 },
};

const blue: Theme = {
  dark: "#071a45",
  light: "#2f6ad0",
  art: { file: "trade-route.png", x: -472, y: 0, width: 1472, height: 400, fadeFrom: 380, fadeTo: 640 },
};

const orange: Theme = {
  dark: "#1f0e04",
  light: "#b5621f",
  art: { file: "shadow-front.png", x: 280, y: -50, width: 720, height: 690, fadeFrom: 280, fadeTo: 540 },
};

const banners: Banner[] = [
  { name: "arms-race-a", title: ["Arms Race"], theme: purple, trade: "pause", variant: "Part A" },
  { name: "arms-race-b", title: ["Arms Race"], theme: purple, trade: "pause", variant: "Part B" },
  { name: "trade-route", title: ["Defend the", "Trade Route"], theme: blue, trade: "keep" },
  { name: "shadow-front-1", title: ["Shadow Front"], theme: orange, trade: "keep", variant: "Squad 1" },
  { name: "shadow-front-2", title: ["Shadow Front"], theme: orange, trade: "keep", variant: "Squad 2" },
];

const trades: Record<Trade, { label: string; tile: string; cubes: string; pill: string }> = {
  keep: { label: "Keep trading", tile: "#24545a", cubes: "#d3ecc9", pill: "#1d8a52" },
  pause: { label: "Pause trade", tile: "#5c1f27", cubes: "#f6cfc9", pill: "#b3262b" },
};

const renderOpts: ResvgRenderOptions = {
  font: { fontFiles: [fontFile], loadSystemFonts: false, defaultFontFamily: FONT },
};

function textWidth(text: string, size: number, spacing: number): number {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="400">
    <text x="0" y="300" font-family="${FONT}" font-size="${size}" letter-spacing="${spacing}">${esc(text)}</text></svg>`;
  return new Resvg(svg, renderOpts).getBBox()?.width ?? 0;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function dataUri(file: string): string {
  return `data:image/png;base64,${readFileSync(join(here, "art", file)).toString("base64")}`;
}

// Three isometric cubes, after the in-game trade icon.
function cubesIcon(x: number, y: number, size: number, fill: string, line: string): string {
  const r = size * 0.24;
  const k = 0.866 * r;
  const cube = (cx: number, cy: number) => {
    const p = (dx: number, dy: number) => `${(cx + dx).toFixed(1)},${(cy + dy).toFixed(1)}`;
    const top = [p(0, -r), p(k, -r / 2), p(0, 0), p(-k, -r / 2)];
    const left = [p(-k, -r / 2), p(0, 0), p(0, r), p(-k, r / 2)];
    const right = [p(0, 0), p(k, -r / 2), p(k, r / 2), p(0, r)];
    return [top, left, right]
      .map((f) => `<polygon points="${f.join(" ")}" fill="${fill}" stroke="${line}" stroke-width="${size * 0.035}" stroke-linejoin="round"/>`)
      .join("");
  };
  const cx = x + size / 2;
  const cy = y + size / 2;
  return cube(cx, cy - r * 0.95) + cube(cx - k, cy + r * 0.55) + cube(cx + k, cy + r * 0.55);
}

function tradeBadge(trade: Trade): string {
  const t = trades[trade];
  const tile = 76;
  const ty = H - MARGIN - tile;
  const pillH = 48;
  const pillY = ty + (tile - pillH) / 2;
  const fontSize = 34;
  const spacing = 1.5;
  const label = t.label.toUpperCase();
  const pillW = textWidth(label, fontSize, spacing) + 36;
  const pillX = MARGIN + tile + 14;
  return `
    <rect x="${MARGIN}" y="${ty}" width="${tile}" height="${tile}" rx="14" fill="${t.tile}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
    ${cubesIcon(MARGIN + 8, ty + 8, tile - 16, t.cubes, t.tile)}
    <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="10" fill="${t.pill}"/>
    <text x="${pillX + 18}" y="${pillY + pillH / 2 + fontSize * 0.36}" font-family="${FONT}" font-size="${fontSize}"
      letter-spacing="${spacing}" fill="#ffffff">${esc(label)}</text>`;
}

function variantTag(variant: string): string {
  const fontSize = 46;
  const spacing = 2;
  const label = variant.toUpperCase();
  const w = textWidth(label, fontSize, spacing) + 44;
  const h = 64;
  const x = W - MARGIN - w;
  const y = H - MARGIN - 76 + (76 - h) / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#000000" fill-opacity="0.45" stroke="${CREAM}" stroke-opacity="0.85" stroke-width="2.5"/>
    <text x="${x + 22}" y="${y + h / 2 + fontSize * 0.36}" font-family="${FONT}" font-size="${fontSize}"
      letter-spacing="${spacing}" fill="${CREAM}">${esc(label)}</text>`;
}

function title(lines: string[]): string {
  const size = lines.length > 1 ? 92 : 112;
  const lineHeight = size * 0.92;
  return lines
    .map(
      (l, i) =>
        `<text x="${MARGIN}" y="${MARGIN + size * 0.78 + i * lineHeight}" font-family="${FONT}" font-size="${size}"
          letter-spacing="2" fill="${CREAM}" filter="url(#shadow)">${esc(l.toUpperCase())}</text>`,
    )
    .join("");
}

function svg(b: Banner): string {
  const a = b.theme.art;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${b.theme.dark}"/>
      <stop offset="1" stop-color="${b.theme.light}"/>
    </linearGradient>
    <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="${a.fadeFrom}" y1="0" x2="${a.fadeTo}" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#fff" stop-opacity="1"/>
    </linearGradient>
    <mask id="artMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="url(#fade)"/>
    </mask>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.35"/>
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <image href="${dataUri(a.file)}" x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}"
    preserveAspectRatio="xMidYMid slice" mask="url(#artMask)"/>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect width="${W}" height="${H}" fill="url(#bottomShade)"/>
  ${title(b.title)}
  ${tradeBadge(b.trade)}
  ${b.variant ? variantTag(b.variant) : ""}
</svg>`;
}

const only = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
for (const b of banners) {
  if (only.length > 0 && !only.includes(b.name)) continue;
  const png = new Resvg(svg(b), { ...renderOpts, fitTo: { mode: "width", value: W } }).render().asPng();
  writeFileSync(join(outDir, `${b.name}.png`), png);
  console.log(`wrote public/banners/${b.name}.png`);
}
