const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  if (!html.includes('[data-theme="dark"] #loading-3d')) {
    html = html.replace(
      '[data-theme="dark"] #viewport-3d-box {',
      '[data-theme="dark"] #loading-3d {\n      background: rgba(20, 25, 35, 0.95) !important;\n      border-color: rgba(255, 255, 255, 0.12) !important;\n    }\n    [data-theme="dark"] #viewport-3d-box {'
    );
    fs.writeFileSync(file, html);
    console.log('Added dark mode CSS to', file);
  }
}
