const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  html = html.replace(
    "console.error('Error loading model.glb:', err);",
    "console.error('Error loading model.glb:', err);\n          const loaderEl = document.getElementById('loading-3d');\n          if (loaderEl) loaderEl.innerText = 'เกิดข้อผิดพลาดในการโหลดโมเดล';"
  );
  
  fs.writeFileSync(file, html);
}
