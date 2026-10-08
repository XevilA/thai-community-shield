const fs = require('fs');
const swPaths = [
  '/Volumes/MAC/Thai_Community/server/public/sw.js',
  '/Volumes/MAC/Thai_Community/public/sw.js'
];
for (const swPath of swPaths) {
  if (fs.existsSync(swPath)) {
    let sw = fs.readFileSync(swPath, 'utf8');
    sw = sw.replace(/const CACHE_NAME = 'community-shield-v[0-9.]+';/, "const CACHE_NAME = 'community-shield-v1.0.4';");
    fs.writeFileSync(swPath, sw);
  }
}
