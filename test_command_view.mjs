import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = process.argv[2] || 'http://localhost:3000';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9260;
const profileDir = `/tmp/test-chrome-profile-${Date.now()}`;

console.log('Launching headless Chrome on port', port, 'for', targetUrl);
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
  console.log(`Waiting for Chrome port ${port}...`);
  let ok = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        ok = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!ok) {
    throw new Error(`Chrome remote port ${port} not reachable`);
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

  if (!pageTarget) {
    throw new Error('Could not find active page target');
  }

  console.log('Connecting to page WebSocket:', pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject, method });
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`Timeout waiting for CDP ${method} (id=${id})`));
        }
      }, 15000);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = async (event) => {
    let raw;
    if (typeof event.data === 'string') {
      raw = event.data;
    } else if (event.data && typeof event.data.text === 'function') {
      raw = await event.data.text();
    } else {
      raw = event.data.toString();
    }
    try {
      const data = JSON.parse(raw);
      if (data.id && pending.has(data.id)) {
        const p = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) p.reject(data.error);
        else p.resolve(data.result);
      }
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  };

  if (ws.readyState !== 1) {
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
  }
  console.log('WebSocket connected. Initializing CDP domains...');

  console.log('Waiting 6s for 3D model and scene rendering...');
  await new Promise((r) => setTimeout(r, 6000));

  // 1. Switch to Command view and test dispatch
  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          setAppMode('command');
          
          // Also test citizen dispatch
          document.getElementById('cit-house').value = 'A-008';
          onCitizenHouseSelect('A-008');
          document.getElementById('cit-status').value = 'confirmed_safe';
          await updateCitizenRegistry();
          await dispatchForSelectedCitizen();

          // Also test nurse dispatch
          await dispatchNurseAction('A-012', 'จ่ายถังออกซิเจนสำรองใบที่ 2 ขนาด 10 ลิตร จากศูนย์ชุมชน');

          const canvas = document.querySelector('#webgl-container canvas');
          return {
            cmdDisplay: document.getElementById('command-view').style.display,
            canvasWidth: canvas?.width,
            canvasHeight: canvas?.height,
            sceneCount: scene?.children?.length,
            tasksCount: state?.tasks?.length,
            houseStatus: state?.households?.find(h => h.code === 'A-008')?.access_status
          };
        } catch (err) {
          return { error: err.message, stack: err.stack };
        }
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Command View & Dispatch Evaluation:', evalRes.result?.value || evalRes);

  // Take screenshot of 3D Command Center
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('command_3d_screenshot.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved command_3d_screenshot.png');

  // 2. Test Tsunami visual simulation & screenshot
  const tsunamiEval = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        await changeDisasterMode('tsunami');
        return {
          currentMode: currentDisasterMode,
          tsunamiGroupVisible: tsunamiGroup ? tsunamiGroup.visible : false,
          tsunamiChildren: tsunamiGroup ? tsunamiGroup.children.length : 0,
          debrisCount: tsunamiDebrisList ? tsunamiDebrisList.length : 0,
          sprayParticles: sprayGeo ? sprayGeo.attributes.position.count : 0
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Tsunami Simulation Evaluation:', tsunamiEval.result?.value || tsunamiEval);
  await new Promise((r) => setTimeout(r, 1500));
  const shotTsunami = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tsunami_screenshot.png', Buffer.from(shotTsunami.data, 'base64'));
  console.log('Saved tsunami_screenshot.png');

  // 3. Test Wildfire visual simulation & screenshot
  const wildfireEval = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        await changeDisasterMode('wildfire');
        return {
          currentMode: currentDisasterMode,
          fireGroupVisible: fireGroup ? fireGroup.visible : false,
          smokeParticles: smokeGeo ? smokeGeo.attributes.position.count : 0,
          emberParticles: emberGeo ? emberGeo.attributes.position.count : 0
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Wildfire Simulation Evaluation:', wildfireEval.result?.value || wildfireEval);
  await new Promise((r) => setTimeout(r, 1500));
  const shotWildfire = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('wildfire_screenshot.png', Buffer.from(shotWildfire.data, 'base64'));
  console.log('Saved wildfire_screenshot.png');

  // 4. Test Nurse Triage modal & screenshot
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        openModal('nurse-triage-modal');
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 800));
  const shotNurse = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('nurse_screenshot.png', Buffer.from(shotNurse.data, 'base64'));
  console.log('Saved nurse_screenshot.png');

  ws.close();
  chrome.kill();
  console.log('🎉 Done capturing all screenshots!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
