const fs = require('fs');

// 1. Bump SW cache version
const swPaths = [
  '/Volumes/MAC/Thai_Community/server/public/sw.js',
  '/Volumes/MAC/Thai_Community/public/sw.js'
];
for (const swPath of swPaths) {
  if (fs.existsSync(swPath)) {
    let sw = fs.readFileSync(swPath, 'utf8');
    sw = sw.replace(/const CACHE_NAME = 'community-shield-v[0-9.]+';/, "const CACHE_NAME = 'community-shield-v1.0.3';");
    fs.writeFileSync(swPath, sw);
  }
}

// 2. Add resize dispatch to init3D
const htmlPaths = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const htmlPath of htmlPaths) {
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Force a resize after loading model
    if (!html.includes("window.dispatchEvent(new Event('resize'));")) {
      html = html.replace(
        "const loaderEl = document.getElementById('loading-3d');",
        "const loaderEl = document.getElementById('loading-3d');\n          setTimeout(() => window.dispatchEvent(new Event('resize')), 500);"
      );
    }
    
    fs.writeFileSync(htmlPath, html);
  }
}

