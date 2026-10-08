import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = 'http://localhost:3000';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9272;
const profileDir = `/Volumes/MAC/tmp/test-desktop-profile-${Date.now()}`;

console.log('Launching headless Chrome desktop at 1440x900...');
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1440,900',
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

  await new Promise((r) => setTimeout(r, 3000));

  // Capture screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Volumes/MAC/Thai_Community/desktop_verified.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved to /Volumes/MAC/Thai_Community/desktop_verified.png');

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
