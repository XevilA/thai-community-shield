const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  html = html.replace(
    '#canvas-container {\n      width: 100%;\n      height: 100%;\n    }',
    '#canvas-container {\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      z-index: 1;\n    }'
  );
  
  fs.writeFileSync(file, html);
}
