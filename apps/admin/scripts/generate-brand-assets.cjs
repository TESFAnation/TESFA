/* eslint-disable @typescript-eslint/no-require-imports */
// Purely typographic identity: TESFA in uppercase. No decorative mark.
// Run from apps/admin with `node scripts/generate-brand-assets.cjs`.
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const mobile = path.resolve(__dirname, '../../mobile/assets/images');
const admin = path.resolve(__dirname, '../app');
const navy = '#173B63';

function art(size, options = {}) {
  const transparent = options.transparent ?? false;
  const ink = options.ink ?? '#FFFFFF';
  const letterSize = Math.round(size * .17);
  const spacing = Math.round(size * .014);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${transparent ? '' : `<rect width="${size}" height="${size}" fill="${navy}"/>`}
    <text x="50%" y="50%" dy=".34em" text-anchor="middle" font-family="Arial, DejaVu Sans, sans-serif" font-size="${letterSize}" font-weight="700" letter-spacing="${spacing}" fill="${ink}">TESFA</text>
  </svg>`);
}

async function generate() {
  fs.mkdirSync(mobile, { recursive: true });
  const images = [
    [mobile, 'icon.png', 1024, {}],
    [mobile, 'android-icon-foreground.png', 432, { transparent: true }],
    [mobile, 'android-icon-monochrome.png', 432, { transparent: true }],
    [mobile, 'android-icon-background.png', 432, {}],
    [mobile, 'splash-icon.png', 1024, { transparent: true }],
    [mobile, 'favicon.png', 64, {}],
    [admin, 'icon.png', 128, {}],
  ];
  for (const [dir, filename, size, options] of images) {
    await sharp(art(size, options)).png().toFile(path.join(dir, filename));
  }
  process.stdout.write('Generated plain TESFA icon, splash and favicon assets.\n');
}

generate().catch((error) => { console.error(error); process.exit(1); });
