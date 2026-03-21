import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DROPS = `
  <path d="M47 88 C38 78,37 60,43 44 C48 28,57 15,65 5 C73 15,88 28,94 50 C97 68,88 88,73 94 C67 96,61 93,58 87"
        fill="none" stroke="#7CBDE8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" fill="#7CBDE8"
        d="M29 10 C24 16,8 36,8 54 C8 68,18 79,29 79 C40 79,50 68,50 54 C50 36,34 16,29 10Z
           M29 28 C26 33,18 44,18 54 C18 62,23 67,29 67 C35 67,40 62,40 54 C40 44,32 33,29 28Z"/>
`;

// For PNGs: white background (matches browser tab look)
const pngSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" fill="white"/>
  ${DROPS}
</svg>`;

// favicon.svg: white bg with rounded corners
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="white"/>
  ${DROPS}
</svg>`;

writeFileSync(join(root, 'public/favicon.svg'), faviconSvg);

async function run() {
  const buf = Buffer.from(pngSvg);
  await sharp(buf).resize(64, 64).png().toFile(join(root, 'public/favicon-64.png'));
  await sharp(buf).resize(32, 32).png().toFile(join(root, 'public/favicon-32.png'));
  console.log('✓ favicon.svg');
  console.log('✓ favicon-64.png');
  console.log('✓ favicon-32.png');
}

run().catch(console.error);
