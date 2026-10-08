const fs = require('fs');
const buffer = fs.readFileSync('/Volumes/MAC/Thai_Community/public/model.glb');
const chunk0Length = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonStr);

console.log('Images in GLB:', gltf.images ? gltf.images.length : 0);
if (gltf.images) {
  gltf.images.forEach((img, i) => {
    console.log(`Image ${i}: name=${img.name}, mimeType=${img.mimeType}, bufferView=${img.bufferView}`);
    if (img.bufferView !== undefined) {
      const bv = gltf.bufferViews[img.bufferView];
      console.log(`   length: ${(bv.byteLength / 1024).toFixed(1)} KB`);
    }
  });
}
