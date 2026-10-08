const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  html = html.replace(
    'if (color === null) color = 0xd4d4d4; // Default fallback architecture color',
    'if (color === null) color = 0x8a9ba8; // Darker fallback'
  );
  
  html = html.replace(
    /const tunedMat = new THREE\.MeshLambertMaterial\(\{[\s\S]*?color,[\s\S]*?side: THREE\.DoubleSide[\s\S]*?\}\);/m,
    `const tunedMat = new THREE.MeshLambertMaterial({
              color,
              side: THREE.DoubleSide,
              transparent: m.transparent || false,
              opacity: m.opacity !== undefined ? m.opacity : 1.0,
              alphaTest: m.alphaTest !== undefined ? m.alphaTest : 0
            });`
  );
  
  fs.writeFileSync(file, html);
}
