const fs = require('fs');

const threeCode = fs.readFileSync('/Volumes/MAC/Thai_Community/public/vendor/three.min.js', 'utf8');
const loaderCode = fs.readFileSync('/Volumes/MAC/Thai_Community/public/vendor/GLTFLoader.js', 'utf8');

const ctx = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Blob: Blob,
  URL: URL,
  document: {
    createElement: () => ({ setAttribute: () => {}, style: {} }),
    createElementNS: () => ({})
  }
};
ctx.window = ctx;
ctx.self = ctx;
ctx.globalThis = ctx;

const vm = require('vm');
vm.createContext(ctx);
vm.runInContext(threeCode, ctx);
vm.runInContext(loaderCode, ctx);

const loader = new ctx.THREE.GLTFLoader();
const buffer = fs.readFileSync('/Volumes/MAC/Thai_Community/public/model.glb');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

console.log('Starting GLTF parse with Three r128...');
const start = Date.now();
loader.parse(
  arrayBuffer,
  '',
  (gltf) => {
    console.log(`PARSE SUCCESSFUL in ${Date.now() - start}ms!`);
    console.log('Children count:', gltf.scene.children.length);
    let meshCount = 0;
    gltf.scene.traverse(c => { if (c.isMesh) meshCount++; });
    console.log('Total meshes:', meshCount);
  },
  (err) => {
    console.error('PARSE ERROR:', err);
  }
);
