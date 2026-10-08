import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = 'http://localhost:3000';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9280;
const profileDir = `/Volumes/MAC/tmp/test-chrome-profile-houses-${Date.now()}`;
fs.mkdirSync('/Volumes/MAC/tmp', { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1600,1200',
  targetUrl
]);

async function run() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }

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

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.onopen = resolve);

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
  await new Promise((r) => setTimeout(r, 2500));

  // Scroll to households grid
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.getElementById('households-grid');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/dotmini/.gemini/antigravity/brain/6283b7ce-2c0c-4e51-9a52-a438a372094f/households_16_verified.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved households_16_verified.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
