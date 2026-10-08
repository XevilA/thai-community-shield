import { spawn } from 'node:child_process';
import fs from 'node:fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--no-sandbox',
  '--disable-gpu-watchdog',
  '--window-size=1600,1000'
]);

async function run() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  const targetRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  let modelLoadTime = null;
  const startTime = Date.now();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p.reject(data.error);
      else p.resolve(data.result);
    } else if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map(a => a.value || a.description).join(' ');
      console.log('[Console]', text);
      if (text.includes('Community 3D model loaded!')) {
        modelLoadTime = Date.now() - startTime;
        console.log(`⚡ MODEL LOADED IN ${modelLoadTime}ms!`);
      }
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.error('❌ [Browser Exception]:', JSON.stringify(data.params.exceptionDetails));
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  console.log('Navigating to http://localhost:3000...');
  await send('Page.navigate', { url: 'http://localhost:3000' });

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const chk = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            loaderDisplay: document.getElementById('loading-3d')?.style?.display,
            sceneChildren: typeof scene !== 'undefined' ? scene?.children?.length : 0,
            hasMeshopt: typeof MeshoptDecoder !== 'undefined'
          };
        })()
      `,
      returnByValue: true
    });
    console.log(`[Check ${i + 1}]`, chk.result?.value);
    if (chk.result?.value?.loaderDisplay === 'none' || chk.result?.value?.sceneChildren > 15) {
      console.log('🎉 3D Scene rendered!');
      break;
    }
  }

  // Capture screenshot of fast-loaded 3D view
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('optimized_3d_screenshot.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved optimized_3d_screenshot.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
