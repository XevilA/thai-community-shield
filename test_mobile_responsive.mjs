import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = 'http://localhost:3000';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9268;
const profileDir = `/Volumes/MAC/tmp/test-mobile-profile-${Date.now()}`;

console.log('Launching headless Chrome mobile at 390x844...');
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=390,844',
  targetUrl
]);

async function run() {
  let ok = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        ok = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!ok) {
    throw new Error('Chrome remote port not reachable');
  }

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await listRes.json();
      pageTarget = list.find((t) => t.type === 'page' && t.url.includes('localhost'));
      if (pageTarget) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

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
      }, 10000);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = async (event) => {
    let raw = event.data;
    if (raw instanceof Blob) raw = await raw.text();
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await new Promise((r) => setTimeout(r, 3000));

  // Check layout widths and overflowing elements
  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const overflowing = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > winWidth + 1) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              className: typeof el.className === 'string' ? el.className : '',
              rectRight: Math.round(rect.right),
              rectWidth: Math.round(rect.width)
            });
          }
        });
        return { docWidth, bodyWidth, winWidth, overflowing: overflowing.slice(0, 10) };
      })()
    `,
    returnByValue: true,
  });

  console.log('Layout Evaluation Result:\n', JSON.stringify(evalRes.result.value, null, 2));

  // Capture screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Volumes/MAC/Thai_Community/mobile_verified.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved to /Volumes/MAC/Thai_Community/mobile_verified.png');

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {}
}

run().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
