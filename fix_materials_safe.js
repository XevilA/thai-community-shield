const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  
  const oldMatLogic = `          if (color === null) color = 0x8a9ba8; // Darker fallback
          if (color !== null) {
            const tunedMat = new THREE.MeshLambertMaterial({
              color,
              side: THREE.DoubleSide,
              transparent: m.transparent || false,
              opacity: m.opacity !== undefined ? m.opacity : 1.0,
              alphaTest: m.alphaTest !== undefined ? m.alphaTest : 0
            });
            if (Array.isArray(child.material)) {
              child.material[idx] = tunedMat;
            } else {
              child.material = tunedMat;
            }
          }`;

  const newMatLogic = `          if (color === null) color = 0x8a9ba8; // Darker fallback
          if (color !== null) {
            m.color = new THREE.Color(color);
            m.side = THREE.DoubleSide;
            // Keep original transparent, opacity, alphaTest, map, etc.
          }`;

  html = html.replace(oldMatLogic, newMatLogic);
  fs.writeFileSync(file, html);
}
