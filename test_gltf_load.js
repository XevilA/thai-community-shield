const fs = require('fs');

// Inspect GLB file
const buffer = fs.readFileSync('/Volumes/MAC/Thai_Community/public/model.glb');
console.log('GLB size:', buffer.length, 'bytes');

// Check GLB header
const magic = buffer.toString('utf8', 0, 4);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);
console.log('Magic:', magic, 'Version:', version, 'Header length:', length);

// Check first chunk
const chunk0Length = buffer.readUInt32LE(12);
const chunk0Type = buffer.toString('utf8', 16, 20);
console.log('Chunk 0:', chunk0Type, chunk0Length);

const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonStr);
console.log('Meshes count:', gltf.meshes ? gltf.meshes.length : 0);
console.log('Materials count:', gltf.materials ? gltf.materials.length : 0);
if (gltf.materials) {
  console.log('Sample materials:', gltf.materials.slice(0, 5));
}
