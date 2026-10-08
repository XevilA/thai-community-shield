const fs = require('fs');
const THREE = require('three');

// Load GLTFLoader
const loaderPath = '/Volumes/MAC/Thai_Community/public/vendor/GLTFLoader.js';
const loaderCode = fs.readFileSync(loaderPath, 'utf8');

// Fake browser environment for GLTFLoader
global.THREE = THREE;
global.window = global;
global.document = {
  createElement: () => ({ setAttribute: () => {}, style: {} }),
  createElementNS: () => ({})
};
global.self = global;

eval(loaderCode);

const loader = new THREE.GLTFLoader();
const buffer = fs.readFileSync('/Volumes/MAC/Thai_Community/public/model.glb');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

console.log('Starting GLTF parse...');
const start = Date.now();
loader.parse(
  arrayBuffer,
  '',
  (gltf) => {
    console.log(`SUCCESS in ${Date.now() - start}ms! Parsed GLTF scene with children:`, gltf.scene.children.length);
    let meshCount = 0;
    gltf.scene.traverse((child) => {
      if (child.isMesh) meshCount++;
    });
    console.log(`Total Meshes: ${meshCount}`);
  },
  (err) => {
    console.error('PARSE ERROR:', err);
  }
);
