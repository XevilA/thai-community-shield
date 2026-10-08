import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = '/Volumes/MAC/Thai_Community/test_screenshots';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9335',
    '--user-data-dir=/tmp/chrome_test_profile_elem_' + Date.now(),
    '--use-gl=angle',
    '--enable-webgl',
    '--no-first-run',
    '--no-default-browser-check'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9335/json/version');
      if (res.ok) break;
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const targetRes = await fetch('http://127.0.0.1:9335/json/new', { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) {
      const { res, rej } = pending.get(d.id);
      pending.delete(d.id);
      d.error ? rej(d.error) : res(d.result);
    }
  };
  await new Promise(r => ws.onopen = r);
  const send = (m, p = {}) => new Promise((res, rej) => {
    const cur = id++;
    pending.set(cur, { res, rej });
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  // Mobile 390x844
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 3000));

  // Reset to flood step 0 and scroll #viewport-3d-box into view
  await send('Runtime.evaluate', {
    expression: `
      window.changeDisasterMode('flood');
      window.setSimulationStep(0);
      document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture viewport scrolled to 3D box
  const { data: d1 } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SCREENSHOT_DIR, 'mobile_scrolled_flood.png'), Buffer.from(d1, 'base64'));
  console.log('Saved mobile_scrolled_flood.png');

  // Wildfire
  await send('Runtime.evaluate', {
    expression: `
      window.changeDisasterMode('wildfire');
      document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const { data: d2 } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SCREENSHOT_DIR, 'mobile_scrolled_wildfire.png'), Buffer.from(d2, 'base64'));
  console.log('Saved mobile_scrolled_wildfire.png');

  // Tsunami
  await send('Runtime.evaluate', {
    expression: `
      window.changeDisasterMode('tsunami');
      document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const { data: d3 } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SCREENSHOT_DIR, 'mobile_scrolled_tsunami.png'), Buffer.from(d3, 'base64'));
  console.log('Saved mobile_scrolled_tsunami.png');

  // Earthquake
  await send('Runtime.evaluate', {
    expression: `
      window.changeDisasterMode('earthquake');
      document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const { data: d4 } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SCREENSHOT_DIR, 'mobile_scrolled_earthquake.png'), Buffer.from(d4, 'base64'));
  console.log('Saved mobile_scrolled_earthquake.png');

  // Also capture clip of #viewport-3d-box directly
  const { result: boxMetrics } = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const box = document.getElementById('viewport-3d-box');
        const rect = box.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })()
    `,
    returnByValue: true
  });
  console.log('3D Box rect on mobile:', boxMetrics.value);

  ws.close();
  chromeProcess.kill();
  console.log('Element capture done!');
}

run().catch(console.error);
