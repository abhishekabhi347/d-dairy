import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('assets/images');
await mkdir(outDir, { recursive: true });

const INK = '#2D2A24';
const CREAM = '#FFF9F3';
const PAPER = '#F5EFE4';
const ACCENT = '#C25E46';
const ACCENT_DARK = '#A94B36';
const GOLD = '#B3833B';
const SOFT = '#F4DCD2';

function bookMark({ scale = 1, background = 'transparent' } = {}) {
  const s = scale;
  const cx = 512;
  const cy = 512;
  return `
    <g transform="translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})">
      <rect x="316" y="236" width="392" height="548" rx="58" fill="${CREAM}" />
      <rect x="316" y="236" width="392" height="548" rx="58" fill="none" stroke="rgba(45,42,36,0.08)" stroke-width="3" />
      <rect x="358" y="236" width="18" height="548" fill="${SOFT}" />
      <rect x="418" y="360" width="214" height="26" rx="13" fill="${ACCENT}" opacity="0.78" />
      <rect x="418" y="424" width="168" height="22" rx="11" fill="${ACCENT}" opacity="0.5" />
      <rect x="418" y="478" width="190" height="22" rx="11" fill="${ACCENT}" opacity="0.5" />
      <rect x="418" y="532" width="132" height="22" rx="11" fill="${ACCENT}" opacity="0.34" />
      <path d="M618 236 h58 v206 l-29 -26 -29 26 Z" fill="${GOLD}" />
      <circle cx="648" cy="700" r="13" fill="${ACCENT}" opacity="0.2" />
      ${background}
    </g>`;
}

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT}" />
      <stop offset="1" stop-color="${ACCENT_DARK}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.15" r="0.85">
      <stop offset="0" stop-color="#E58A6A" stop-opacity="0.7" />
      <stop offset="1" stop-color="#E58A6A" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)" />
  <rect width="1024" height="1024" fill="url(#glow)" />
  <circle cx="830" cy="168" r="220" fill="none" stroke="${CREAM}" stroke-opacity="0.13" stroke-width="3" />
  <circle cx="132" cy="900" r="150" fill="${CREAM}" fill-opacity="0.06" />
  ${bookMark()}
</svg>`;

const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${bookMark({ scale: 0.72 })}
</svg>`;

const monochromeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g fill="#FFFFFF">
    <rect x="316" y="236" width="392" height="548" rx="58" />
    <rect x="418" y="360" width="214" height="26" rx="13" fill="#000000" />
    <rect x="418" y="424" width="168" height="22" rx="11" fill="#000000" />
    <rect x="418" y="478" width="190" height="22" rx="11" fill="#000000" />
    <rect x="418" y="532" width="132" height="22" rx="11" fill="#000000" />
  </g>
</svg>`;

const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="page" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${CREAM}" />
      <stop offset="1" stop-color="#F8E8DE" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" rx="224" fill="${ACCENT}" />
  <circle cx="790" cy="190" r="210" fill="none" stroke="${CREAM}" stroke-opacity="0.14" stroke-width="6" />
  <g transform="translate(512 512) scale(0.82) translate(-512 -512)">
    <rect x="316" y="236" width="392" height="548" rx="58" fill="url(#page)" />
    <rect x="358" y="236" width="18" height="548" fill="${SOFT}" />
    <rect x="418" y="360" width="214" height="26" rx="13" fill="${ACCENT}" opacity="0.78" />
    <rect x="418" y="424" width="168" height="22" rx="11" fill="${ACCENT}" opacity="0.5" />
    <rect x="418" y="478" width="190" height="22" rx="11" fill="${ACCENT}" opacity="0.5" />
    <rect x="418" y="532" width="132" height="22" rx="11" fill="${ACCENT}" opacity="0.34" />
    <path d="M618 236 h58 v206 l-29 -26 -29 26 Z" fill="${GOLD}" />
  </g>
</svg>`;

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="15" fill="${ACCENT}" />
  <rect x="19" y="14" width="26" height="36" rx="4" fill="${CREAM}" />
  <rect x="21.5" y="14" width="2.5" height="36" fill="${SOFT}" />
  <rect x="27" y="22" width="13" height="2.6" rx="1.3" fill="${ACCENT}" />
  <rect x="27" y="28" width="10" height="2.2" rx="1.1" fill="${ACCENT}" opacity="0.6" />
  <rect x="27" y="33.5" width="12" height="2.2" rx="1.1" fill="${ACCENT}" opacity="0.6" />
  <path d="M39 14 h4 v12 l-2 -1.8 -2 1.8 Z" fill="${GOLD}" />
</svg>`;

async function render(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, file));
  console.log(`wrote assets/images/${file}`);
}

await render(iconSvg, 1024, 'icon.png');
await render(foregroundSvg, 1024, 'android-icon-foreground.png');
await render(monochromeSvg, 1024, 'android-icon-monochrome.png');
await render(splashSvg, 1024, 'splash-icon.png');
await render(faviconSvg, 64, 'favicon.png');
await render(foregroundSvg, 512, 'icon-512.png');

const solid = await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: PAPER },
})
  .png()
  .toBuffer();
await sharp(solid).toFile(path.join(outDir, 'android-icon-background.png'));

console.log(`paper ${INK}`);
