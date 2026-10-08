import { spawn } from 'node:child_process';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--user-data-dir=/tmp/test-perf2',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--no-sandbox',
  '--disable-gpu-watchdog'
]);

async function run() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9226/json/version');
      if (res.ok) break;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  const targetRes = await fetch('http://127.0.0.1:9226/json/new?about:blank', { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const cur = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === cur) {
        ws.removeEventListener('message', handler);
        res(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });
  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Network.enable');

  const reqTimes = new Map();
  const start = Date.now();

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Network.requestWillBeSent') {
      reqTimes.set(msg.params.requestId, { url: msg.params.request.url, t: Date.now() });
      console.log(`[REQ T+${Date.now() - start}ms] ${msg.params.request.url}`);
    } else if (msg.method === 'Network.responseReceived') {
      const info = reqTimes.get(msg.params.requestId);
      const dur = info ? Date.now() - info.t : 0;
      console.log(`[RESP ${msg.params.response.status} in ${dur}ms] ${msg.params.response.url} (${msg.params.response.mimeType})`);
    } else if (msg.method === 'Network.loadingFailed') {
      console.error(`[FAIL] ${msg.params.errorText} for request ${msg.params.requestId}`);
    }
  });

  console.log('Navigating now...');
  await send('Page.navigate', { url: 'https://thai-community-shield.vercel.app' });
  console.log(`Navigation promise resolved in ${Date.now() - start}ms`);

  await new Promise(r => setTimeout(r, 12000));
  ws.close();
  chrome.kill();
  process.exit(0);
}
run();
