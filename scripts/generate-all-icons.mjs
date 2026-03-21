import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const witApp   = join(root, 'logo_druppel_wit_app.png');     // white bg, for app icon
const noBg     = join(root, 'logo_druppel_zonder_achtergrond.png'); // transparent

// ── Favicon PNGs (white background) ──────────────────────────────────────────
async function generateFavicons() {
  for (const size of [32, 64]) {
    await sharp(witApp)
      .resize(size, size)
      .png()
      .toFile(join(root, `public/favicon-${size}.png`));
    console.log(`✓ favicon-${size}.png`);
  }
}

// ── Android launcher icons ────────────────────────────────────────────────────
const sizes = {
  'mipmap-mdpi':    { launcher: 48,  foreground: 108 },
  'mipmap-hdpi':    { launcher: 72,  foreground: 162 },
  'mipmap-xhdpi':   { launcher: 96,  foreground: 216 },
  'mipmap-xxhdpi':  { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

async function generateAndroid() {
  for (const [folder, s] of Object.entries(sizes)) {
    const dir = join(root, 'android/app/src/main/res', folder);

    // ic_launcher.png — white bg app icon
    await sharp(witApp)
      .resize(s.launcher, s.launcher)
      .png()
      .toFile(join(dir, 'ic_launcher.png'));

    // ic_launcher_round.png — same
    await sharp(witApp)
      .resize(s.launcher, s.launcher)
      .png()
      .toFile(join(dir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png — wit logo, gecentreerd met padding voor adaptive icon safe zone
    const fg = s.foreground;
    const logoSize = Math.round(fg * 0.66);
    const pad = Math.round((fg - logoSize) / 2);

    await sharp(witApp)
      .resize(logoSize, logoSize)
      .extend({ top: pad, bottom: fg - logoSize - pad, left: pad, right: fg - logoSize - pad, background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(join(dir, 'ic_launcher_foreground.png'));

    console.log(`✓ ${folder}`);
  }
}

// ── Public logo copy (for use in React app) ───────────────────────────────────
async function copyPublicLogo() {
  await sharp(noBg).png().toFile(join(root, 'public/logo.png'));
  console.log('✓ public/logo.png');
}

async function run() {
  await generateFavicons();
  await generateAndroid();
  await copyPublicLogo();
  console.log('\nAll done!');
}

run().catch(console.error);
