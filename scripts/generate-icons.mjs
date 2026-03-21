import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DROPS_100 = `
  <path d="M47 88 C38 78,37 60,43 44 C48 28,57 15,65 5 C73 15,88 28,94 50 C97 68,88 88,73 94 C67 96,61 93,58 87"
        fill="none" stroke="#7CBDE8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" fill="#7CBDE8"
        d="M29 10 C24 16,8 36,8 54 C8 68,18 79,29 79 C40 79,50 68,50 54 C50 36,34 16,29 10Z
           M29 28 C26 33,18 44,18 54 C18 62,23 67,29 67 C35 67,40 62,40 54 C40 44,32 33,29 28Z"/>
`;

// ic_launcher.png — dark navy background (matches image 2 the user provided)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0f172a"/>
  ${DROPS_100}
</svg>`;

// ic_launcher_foreground.png — transparent bg, content in adaptive icon safe zone
// Safe zone = inner 66% of 108x108 = range [18,90]. Use viewBox with 18px padding.
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-18 -18 136 136">
  ${DROPS_100}
</svg>`;

const sizes = {
  'mipmap-mdpi':    { launcher: 48,  foreground: 108, round: 48  },
  'mipmap-hdpi':    { launcher: 72,  foreground: 162, round: 72  },
  'mipmap-xhdpi':   { launcher: 96,  foreground: 216, round: 96  },
  'mipmap-xxhdpi':  { launcher: 144, foreground: 324, round: 144 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432, round: 192 },
};

async function generate() {
  for (const [folder, s] of Object.entries(sizes)) {
    const dir = join(root, 'android/app/src/main/res', folder);

    await sharp(Buffer.from(iconSvg))
      .resize(s.launcher, s.launcher)
      .png()
      .toFile(join(dir, 'ic_launcher.png'));

    await sharp(Buffer.from(iconSvg))
      .resize(s.round, s.round)
      .png()
      .toFile(join(dir, 'ic_launcher_round.png'));

    await sharp(Buffer.from(fgSvg))
      .resize(s.foreground, s.foreground)
      .png()
      .toFile(join(dir, 'ic_launcher_foreground.png'));

    console.log(`✓ ${folder}`);
  }
  console.log('Done!');
}

generate().catch(console.error);
