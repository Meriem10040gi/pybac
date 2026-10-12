// Builds the web app icons from assets/logo.png (the same logo as the Android app).
// Run: node scripts/make-icons.cjs   (needs jimp-compact: npm i -D jimp-compact)
// The logo already keeps its drawing inside the central 80 %, so it is also a valid "maskable" icon.
const path = require('path');
const Jimp = require('jimp-compact');

const DIR = path.join(__dirname, '..', 'public');

(async () => {
  const logo = await Jimp.read(path.join(__dirname, '..', 'assets', 'logo.png'));
  for (const [name, size] of [['pwa-192.png', 192], ['pwa-512.png', 512], ['apple-touch-icon.png', 180], ['favicon.png', 64]]) {
    await logo.clone().resize(size, size, Jimp.RESIZE_BICUBIC).writeAsync(path.join(DIR, name));
  }
  // smaller copy shown inside the app (sidebar, top bar)
  await logo.clone().resize(96, 96, Jimp.RESIZE_BICUBIC).writeAsync(path.join(DIR, 'logo-96.png'));
  console.log('icons written in public/');
})();
