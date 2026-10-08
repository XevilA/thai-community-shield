import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = '/Volumes/MAC/Thai_Community/test_screenshots';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function resetServerMode(mode = 'flood') {
  try {
    await fetch('http://localhost:3000/api/disaster-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
  } catch (e) {}
}

async function runCapture() {
  await resetServerMode('flood');

  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9337',
    '--user-data-dir=/tmp/chrome_test_profile_v3_' + Date.now(),
    '--use-gl=angle',
    '--enable-webgl',
    '--no-first-run',
    '--no-default-browser-check'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9337/json/version');
      if (res.ok) break;
    } catch {
      await new Promise(r => setTimeout(r, 250));
    }
  }

  async function createSession(width, height, isMobile = false) {
    const targetRes = await fetch('http://127.0.0.1:9337/json/new', { method: 'PUT' });
    const target = await targetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise(resolve => ws.onopen = resolve);

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile
    });

    if (isMobile) {
      await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    }

    return { ws, send, targetId: target.id };
  }

  async function captureScene(session, filename, actions = async () => {}) {
    await actions(session.send);
    await new Promise(r => setTimeout(r, 2200)); // allow camera lerp and particles to settle
    const { data } = await session.send('Page.captureScreenshot', { format: 'png' });
    const filePath = join(SCREENSHOT_DIR, filename);
    writeFileSync(filePath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);
  }

  try {
    // ==========================================
    // 1. DESKTOP TESTS (1280x850)
    // ==========================================
    console.log('--- Running Desktop Tests (1280x850) ---');
    await resetServerMode('flood');
    const desktop = await createSession(1280, 850, false);
    await desktop.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3000));

    // Desktop Flood - Step 0
    await captureScene(desktop, 'desktop_flood_step0.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('flood');
          window.setStep(0);
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Desktop Flood - Step 6 (rising water + submerged boardwalk + green reroute)
    await captureScene(desktop, 'desktop_flood_step6.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('flood');
          window.setStep(6);
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Desktop Wildfire
    await captureScene(desktop, 'desktop_wildfire.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('wildfire');
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Desktop Tsunami
    await captureScene(desktop, 'desktop_tsunami.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('tsunami');
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Desktop Earthquake
    await captureScene(desktop, 'desktop_earthquake.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('earthquake');
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    desktop.ws.close();

    // ==========================================
    // 2. MOBILE TESTS (390x844 - iPhone / Galaxy)
    // ==========================================
    console.log('--- Running Mobile Tests (390x844) ---');
    await resetServerMode('flood');
    const mobile = await createSession(390, 844, true);
    await mobile.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3000));

    // Mobile Flood - Step 0
    await captureScene(mobile, 'mobile_flood_step0.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('flood');
          window.setStep(0);
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Mobile Flood - Step 6 (rising water + dynamic replanning)
    await captureScene(mobile, 'mobile_flood_step6.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('flood');
          window.setStep(6);
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Mobile Wildfire
    await captureScene(mobile, 'mobile_wildfire.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('wildfire');
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Mobile Tsunami
    await captureScene(mobile, 'mobile_tsunami.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('tsunami');
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    // Mobile Earthquake
    await captureScene(mobile, 'mobile_earthquake.png', async (send) => {
      await send('Runtime.evaluate', {
        expression: `
          window.changeDisasterMode('earthquake');
          document.getElementById('viewport-3d-box').scrollIntoView({ behavior: 'instant', block: 'center' });
        `
      });
    });

    mobile.ws.close();
    console.log('All captures complete successfully!');
  } finally {
    chromeProcess.kill();
  }
}

runCapture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
