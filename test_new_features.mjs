import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = 'http://localhost:3000';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9275;
const profileDir = `/Volumes/MAC/tmp/test-chrome-profile-${Date.now()}`;
fs.mkdirSync('/Volumes/MAC/tmp', { recursive: true });

console.log('Launching headless Chrome on port', port, 'for', targetUrl);
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1600,1050',
  targetUrl
]);

async function run() {
  console.log(`Waiting for Chrome port ${port}...`);
  let ok = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) { ok = true; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!ok) throw new Error(`Chrome remote port ${port} not reachable`);

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await listRes.json();
      pageTarget = list.find(t => t.type === 'page' && t.url.includes('localhost'));
      if (pageTarget) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!pageTarget) throw new Error('No page target found');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  function send(method, params = {}) {
    const id = idCounter++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  console.log('Waiting for initial load and 3D scene...');
  await new Promise((r) => setTimeout(r, 3000));

  // 1. Verify 16 Households rendering & addresses
  const houseCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const grid = document.getElementById('households-grid');
        const cards = grid ? grid.querySelectorAll('.house-box') : [];
        const cardTexts = Array.from(cards).map(c => ({
          code: c.querySelector('.house-code')?.innerText,
          title: c.querySelector('.house-title')?.innerText,
          hasAddress: c.innerText.includes('เลขที่'),
          fullText: c.innerText.replace(/\\n/g, ' ')
        }));
        return {
          cardCount: cards.length,
          sampleCards: cardTexts.slice(0, 4),
          housePinsCount: (typeof housePins !== 'undefined') ? housePins.length : 0
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Households check:', JSON.stringify(houseCheck.result?.value, null, 2));

  // 2. Capture Initial Desktop view (Forecast chart + 3D pins)
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/dotmini/.gemini/antigravity/brain/6283b7ce-2c0c-4e51-9a52-a438a372094f/desktop_updated_verified.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved desktop_updated_verified.png');

  // 3. Switch Chart to Historical (พ.ศ. 2554 - 2569)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        setChartMode('historical');
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 600));
  const shotHist = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/dotmini/.gemini/antigravity/brain/6283b7ce-2c0c-4e51-9a52-a438a372094f/historical_chart_verified.png', Buffer.from(shotHist.data, 'base64'));
  console.log('Saved historical_chart_verified.png');

  // 4. Test Step Advance (Step 3: 20:20 - A-012 Critical) & What-If
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        setChartMode('forecast');
        setStep(3);
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 800));

  // 5. Test What-If Rain (+80mm/h)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        triggerWhatIf('rain');
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  const shotWhatIf = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/dotmini/.gemini/antigravity/brain/6283b7ce-2c0c-4e51-9a52-a438a372094f/whatif_simulation_verified.png', Buffer.from(shotWhatIf.data, 'base64'));
  console.log('Saved whatif_simulation_verified.png');

  // 6. Test Mobile Viewport (390x844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        triggerWhatIf('reset');
        setAppMode('command');
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1000));
  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/dotmini/.gemini/antigravity/brain/6283b7ce-2c0c-4e51-9a52-a438a372094f/mobile_updated_verified.png', Buffer.from(shotMobile.data, 'base64'));
  console.log('Saved mobile_updated_verified.png');

  ws.close();
  chrome.kill();
  console.log('🎉 Done capturing all updated test screenshots!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
