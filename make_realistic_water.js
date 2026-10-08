const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  // 1. Add Loading Indicator for 3D
  html = html.replace(
    '<div id="canvas-container"></div>',
    '<div id="canvas-container"></div>\n<div id="loading-3d" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-weight:bold; color:var(--text-secondary); z-index:10;">กำลังโหลดโมเดล 3D (9MB)...</div>'
  );

  // 2. Hide loading indicator when model is loaded
  html = html.replace(
    "console.log('Community 3D model loaded with high-contrast architectural palette!');",
    "console.log('Community 3D model loaded!');\n          const loaderEl = document.getElementById('loading-3d');\n          if (loaderEl) loaderEl.style.display = 'none';"
  );
  
  // 3. Realistic Thai Flood Water Colors (Muddy Brown / Khaki)
  html = html.replace(
    'color: 0x0284c7, // Vibrant river blue',
    'color: 0x6e5c47, // Realistic muddy brown river water'
  );
  html = html.replace(
    'color: 0x0ea5e9, // Flooded urban water',
    'color: 0x7b6852, // Realistic muddy flood water'
  );
  
  // 4. Improve Wave Animation
  html = html.replace(
    'const wave = Math.sin(z * 0.16 + t * 2.8) * 0.035 + Math.cos(x * 0.45 + t * 1.5) * 0.020;',
    'const wave = Math.sin(z * 0.25 + t * 3.5) * 0.06 + Math.cos(x * 0.55 + t * 2.0) * 0.04;'
  );
  html = html.replace(
    'const wave = Math.sin(x * 0.22 + t * 2.2) * 0.025 + Math.cos(z * 0.38 + t * 1.8) * 0.015;',
    'const wave = Math.sin(x * 0.35 + t * 3.0) * 0.04 + Math.cos(z * 0.45 + t * 2.5) * 0.03;'
  );
  
  fs.writeFileSync(file, html);
}
