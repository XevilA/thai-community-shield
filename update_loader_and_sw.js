const fs = require('fs');

// 1. Update sw.js in both locations
const swPaths = [
  '/Volumes/MAC/Thai_Community/server/public/sw.js',
  '/Volumes/MAC/Thai_Community/public/sw.js'
];

for (const swPath of swPaths) {
  if (!fs.existsSync(swPath)) continue;
  let sw = fs.readFileSync(swPath, 'utf8');
  
  // Bump version to v1.0.5
  sw = sw.replace(/const CACHE_NAME = 'community-shield-v[0-9.]+';/, "const CACHE_NAME = 'community-shield-v1.0.5';");
  
  // Remove '/model.glb' from STATIC_ASSETS
  sw = sw.replace(/,\s*'\/?model\.glb'/, '');
  sw = sw.replace(/'\/?model\.glb',\s*/, '');
  
  fs.writeFileSync(swPath, sw);
  console.log('Updated', swPath);
}

// 2. Update index.html in both locations
const htmlPaths = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];

for (const htmlPath of htmlPaths) {
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Replace loading-3d element
  const oldLoadingElRegex = /<div id="loading-3d"[\s\S]*?<\/div>/;
  const newLoadingEl = `<div id="loading-3d" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:15; background:rgba(255, 255, 255, 0.95); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); padding:16px 24px; border-radius:14px; box-shadow:0 12px 36px rgba(0,0,0,0.15); border:1px solid rgba(0,0,0,0.08); text-align:center; min-width:220px; max-width:85%; pointer-events:none;">
              <div style="font-weight:600; font-size:13px; color:var(--text-primary); margin-bottom:4px;">กำลังโหลดแบบจำลอง 3 มิติ</div>
              <div id="loading-progress-text" style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">กำลังเชื่อมต่อโมเดลชุมชน...</div>
              <div style="width:100%; height:5px; background:rgba(0,0,0,0.08); border-radius:3px; overflow:hidden;">
                <div id="loading-progress-bar" style="width:5%; height:100%; background:var(--apple-blue, #0071e3); border-radius:3px; transition:width 0.2s ease;"></div>
              </div>
            </div>`;

  html = html.replace(oldLoadingElRegex, newLoadingEl);

  // Replace loader.load
  const oldLoaderRegex = /loader\.load\(\s*'\/model\.glb'[\s\S]*?undefined,\s*\(err\)\s*=>\s*\{[\s\S]*?\}\s*\);/;
  
  const newLoader = `loader.load(
        '/model.glb',
        (gltf) => {
          const progressText = document.getElementById('loading-progress-text');
          const progressBar = document.getElementById('loading-progress-bar');
          if (progressText) progressText.innerText = 'โหลดสำเร็จ 100% — กำลังจัดวางผัง...';
          if (progressBar) progressBar.style.width = '100%';

          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isLight) {
              child.visible = false;
              child.intensity = 0;
            }
            tuneMeshMaterial(child);
          });
          scene.add(model);
          console.log('Community 3D model loaded!');
          const loaderEl = document.getElementById('loading-3d');
          setTimeout(() => {
            if (loaderEl) loaderEl.style.display = 'none';
            window.dispatchEvent(new Event('resize'));
          }, 350);
        },
        (xhr) => {
          const progressText = document.getElementById('loading-progress-text');
          const progressBar = document.getElementById('loading-progress-bar');
          if (!progressText || !progressBar) return;

          let percent = 0;
          let loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
          if (xhr.lengthComputable && xhr.total > 0) {
            percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
            let totalMB = (xhr.total / (1024 * 1024)).toFixed(1);
            progressText.innerText = \`ดาวน์โหลด \${percent}% (\${loadedMB}/\${totalMB} MB)\`;
          } else {
            // Brotli compressed stream (~1.8 MB)
            percent = Math.min(98, Math.round((xhr.loaded / 1850000) * 100));
            progressText.innerText = \`ดาวน์โหลด \${percent}% (\${loadedMB} MB)...\`;
          }
          progressBar.style.width = \`\${Math.max(5, percent)}%\`;
          if (percent >= 98) {
            progressText.innerText = 'กำลังประมวลผลโมเดล 3D ในหน่วยความจำ...';
          }
        },
        (err) => {
          console.error('Error loading model.glb:', err);
          const loaderEl = document.getElementById('loading-3d');
          if (loaderEl) {
            loaderEl.innerHTML = '<div style="color:var(--apple-red,#ef4444); font-size:12px; font-weight:600;">ดาวน์โหลดไม่สำเร็จ (Timeout)<br><button onclick="location.reload()" style="margin-top:8px; padding:4px 12px; border-radius:6px; border:none; background:#0071e3; color:#fff; cursor:pointer; font-size:11px;">แตะเพื่อโหลดใหม่</button></div>';
          }
        }
      );`;

  html = html.replace(oldLoaderRegex, newLoader);
  fs.writeFileSync(htmlPath, html);
  console.log('Updated', htmlPath);
}
