import { spawn } from 'node:child_process';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9292',
  '--no-sandbox',
  '--window-size=412,915',
  'http://localhost:3000'
]);

async function check() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9292/json/list');
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        ws.onopen = () => {
          ws.send(JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                setAppMode('mobile');
                const mv = document.getElementById('mobile-view');
                const cv = document.getElementById('command-view');
                return {
                  mobDisplay: mv ? mv.style.display : 'no-mv',
                  mobComputedDisplay: mv ? window.getComputedStyle(mv).display : 'no-mv',
                  mobOffsetHeight: mv ? mv.offsetHeight : 0,
                  mobClientHeight: mv ? mv.clientHeight : 0,
                  mobBounding: mv ? JSON.stringify(mv.getBoundingClientRect()) : null,
                  mobChildCount: mv ? mv.children.length : 0,
                  mobTextPreview: mv ? mv.innerText.substring(0, 150) : '',
                  cmdDisplay: cv ? cv.style.display : 'no-cv'
                };
              })()`,
              returnByValue: true
            }
          }));
        };
        ws.onmessage = (e) => {
          console.log('Mobile view diagnostic:', JSON.parse(e.data));
          ws.close();
          chrome.kill();
          process.exit(0);
        };
        return;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
}

check().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
