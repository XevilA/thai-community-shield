const fs = require('fs');
const buffer = fs.readFileSync('/Volumes/MAC/Thai_Community/public/model.glb');
const chunk0Length = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonStr);

console.log('JSON length:', chunk0Length);
let totalAccessorBytes = 0;
let bufferViews = gltf.bufferViews || [];
console.log('BufferViews count:', bufferViews.length);

let sumBV = 0;
bufferViews.forEach(bv => { sumBV += bv.byteLength; });
console.log('Total BufferViews bytes:', (sumBV / (1024 * 1024)).toFixed(2), 'MB');
console.log('File total bytes:', (buffer.length / (1024 * 1024)).toFixed(2), 'MB');
