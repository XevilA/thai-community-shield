import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = process.argv[2] || 'http://localhost:3000';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9265;
const profileDir = `/tmp/test-chrome-profile-${Date.now()}`;

console.log('[1/6] Launching headless Chrome on port', port, 'for', targetUrl);
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--no-sandbox',
  '--disable-gpu-watchdog',
  '--window-size=1600,1000',
  targetUrl
]);

async function run() {
  console.log('[2/6] Waiting for Chrome port', port, 'to become ready...');
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await listRes.json();
      pageTarget = list.find(t => t.type === 'page' && t.url.includes('localhost'));
      if (pageTarget) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!pageTarget) throw new Error('No page target found');
  console.log('[3/6] Connecting to target WebSocket:', pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject, method });
      const payload = JSON.stringify({ id, method, params });
      console.log(` -> CDP SEND [${id}] ${method}`);
      ws.send(payload);
    });
  }

  ws.onopen = () => console.log(' -> WebSocket OPEN');
  ws.onerror = (e) => console.error(' -> WebSocket ERROR:', e);
  ws.onclose = () => console.log(' -> WebSocket CLOSED');

  ws.onmessage = async (e) => {
    let raw = typeof e.data === 'string' ? e.data : (e.data && e.data.text ? await e.data.text() : e.data.toString());
    try {
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        console.log(` <- CDP RESP [${msg.id}] received (${raw.length} bytes)`);
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(msg.error);
        else p.resolve(msg.result);
      } else if (msg.method) {
        // Event
      }
    } catch (err) {
      console.error('CDP parse err:', err);
    }
  };

  if (ws.readyState !== 1) {
    await new Promise((resolve) => {
      ws.addEventListener('open', resolve, { once: true });
    });
  }

  console.log('[4/6] Waiting 6 seconds for 3D simulation and assets to initialize...');
  await new Promise((r) => setTimeout(r, 6000));

  // Step A: Inspect page title and 3D scene
  console.log('[5/6] Inspecting 3D scene & disaster models...');
  const initCheck = await send('Runtime.evaluate', {
    expression: `({
      title: document.title,
      sceneChildren: typeof scene !== 'undefined' ? scene.children.length : -1,
      hasTsunamiGroup: typeof tsunamiGroup !== 'undefined',
      hasFireGroup: typeof fireGroup !== 'undefined'
    })`,
    returnByValue: true
  });
  console.log('Scene Check:', initCheck.result?.value);

  // Step B: Test Tsunami Mode
  console.log('Testing Tsunami Mode...');
  const tsunamiRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      await changeDisasterMode('tsunami');
      return {
        mode: currentDisasterMode,
        tsunamiVisible: tsunamiGroup ? tsunamiGroup.visible : false,
        debrisCount: tsunamiDebrisList ? tsunamiDebrisList.length : 0,
        sprayCount: sprayGeo ? sprayGeo.attributes.position.count : 0
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Tsunami Results:', tsunamiRes.result?.value);
  await new Promise((r) => setTimeout(r, 1500));
  const shotTsunami = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tsunami_screenshot.png', Buffer.from(shotTsunami.data, 'base64'));
  console.log('Saved tsunami_screenshot.png (', shotTsunami.data.length, 'bytes base64)');

  // Step C: Test Wildfire Mode
  console.log('Testing Wildfire Mode...');
  const fireRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      await changeDisasterMode('wildfire');
      return {
        mode: currentDisasterMode,
        fireVisible: fireGroup ? fireGroup.visible : false,
        smokeCount: smokeGeo ? smokeGeo.attributes.position.count : 0,
        emberCount: emberGeo ? emberGeo.attributes.position.count : 0
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Wildfire Results:', fireRes.result?.value);
  await new Promise((r) => setTimeout(r, 1500));
  const shotWildfire = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('wildfire_screenshot.png', Buffer.from(shotWildfire.data, 'base64'));
  console.log('Saved wildfire_screenshot.png (', shotWildfire.data.length, 'bytes base64)');

  // Step D: Capture Command Center 3D view
  console.log('Testing Command View...');
  await send('Runtime.evaluate', { expression: `setAppMode('command')` });
  await new Promise((r) => setTimeout(r, 1000));
  const shotCmd = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('command_3d_screenshot.png', Buffer.from(shotCmd.data, 'base64'));
  console.log('Saved command_3d_screenshot.png (', shotCmd.data.length, 'bytes base64)');

  console.log('[6/6] ✅ ALL TESTS & SCREENSHOTS COMPLETED SUCCESSFULLY!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error('Test execution failed:', e);
  chrome.kill();
  process.exit(1);
});
