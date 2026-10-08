const fs = require('fs');

const htmlFiles = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];

for (const file of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  html = html.replace('<link rel="apple-touch-icon" href="/icon.svg" />', '<link rel="apple-touch-icon" href="/icon-192.png" />');
  
  // Also ensure Service Worker registration is present
  if (!html.includes("navigator.serviceWorker.register('/sw.js')")) {
    html = html.replace('</script>\n</body>', `  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('SW registered:', reg.scope);
      }).catch(err => {
        console.log('SW registration failed:', err);
      });
    });
  }
</script>\n</body>`);
  }
  
  fs.writeFileSync(file, html);
}

const manifestFiles = [
  '/Volumes/MAC/Thai_Community/server/public/manifest.json',
  '/Volumes/MAC/Thai_Community/public/manifest.json'
];

for (const file of manifestFiles) {
  if (!fs.existsSync(file)) continue;
  let manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  manifest.icons = [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ];
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
}

