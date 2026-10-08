import { spawn } from 'node:child_process';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9228',
  '--user-data-dir=/tmp/test-profile-fresh',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--no-sandbox',
  '--disable-gpu-watchdog'
]);

async function run() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9228/json/version');
      if (res.ok) break;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  const targetRes = await fetch('http://127.0.0.1:9228/json/new?https://thai-community-shield.vercel.app', { method: 'PUT' });
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
  await send('Runtime.enable');
  await send('Console.enable');

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[Console]', msg.params.args.map(a => a.value || a.description).join(' '));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('❌ [Exception]', JSON.stringify(msg.params.exceptionDetails));
    }
  });

  await new Promise(r => setTimeout(r, 5000));

  const evalRes = await send('Runtime.evaluate', {
    expression: 'typeof setAppMode',
    returnByValue: true
  });
  console.log('typeof setAppMode:', evalRes.result?.value);

  ws.close();
  chrome.kill();
  process.exit(0);
}
run();
