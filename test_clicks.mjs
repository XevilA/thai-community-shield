import { spawn } from 'node:child_process';
import fs from 'node:fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--no-sandbox',
  '--disable-gpu-watchdog',
  '--user-data-dir=/Volumes/MAC/Thai_Community/.tmp/chrome_test_profile',
  '--window-size=1440,900'
]);

async function run() {
  console.log('Waiting for Chrome remote debugging port...');
  let versionData = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }

  if (!versionData) {
    console.error('Failed to connect to Chrome on port 9222');
    chrome.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome:', versionData.Browser);

  // Test both localhost:3000 and vercel production
  const testUrl = process.argv[2] || 'https://thai-community-shield.vercel.app';
  console.log('Testing URL:', testUrl);

  const targetRes = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(testUrl)}`, { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  const consoleLogs = [];
  const exceptions = [];

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p.reject(data.error);
      else p.resolve(data.result);
    } else if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      consoleLogs.push(`[${data.params.type}] ${text}`);
    } else if (data.method === 'Runtime.exceptionThrown') {
      exceptions.push(JSON.stringify(data.params.exceptionDetails));
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  console.log('Waiting 5s for page to initialize...');
  await new Promise((r) => setTimeout(r, 5000));

  console.log('\n--- CONSOLE LOGS ---');
  consoleLogs.forEach(l => console.log(l));

  console.log('\n--- EXCEPTIONS ---');
  exceptions.forEach(e => console.error(e));

  // Inspect what element is at various positions on the screen
  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const results = {};
      
      // Check elements at center, header, buttons
      const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      results.centerElement = centerEl ? {
        tagName: centerEl.tagName,
        id: centerEl.id,
        className: centerEl.className,
        style: centerEl.getAttribute('style')
      } : null;

      // Check all elements with fixed/absolute and full width/height
      const fullScreenOverlays = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if ((style.position === 'fixed' || style.position === 'absolute') && 
            parseInt(style.zIndex, 10) > 10 && 
            style.display !== 'none' && 
            style.visibility !== 'hidden' &&
            parseFloat(style.opacity) > 0) {
          const rect = el.getBoundingClientRect();
          if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
            fullScreenOverlays.push({
              tagName: el.tagName,
              id: el.id,
              className: el.className,
              zIndex: style.zIndex,
              pointerEvents: style.pointerEvents,
              rect: { w: rect.width, h: rect.height, top: rect.top, left: rect.left }
            });
          }
        }
      });
      results.fullScreenOverlays = fullScreenOverlays;

      // Test click on disaster action bar button
      const disasterButtons = Array.from(document.querySelectorAll('.disaster-pill-btn, .disaster-action-bar button, header button'));
      results.disasterButtons = disasterButtons.map(b => ({
        text: b.innerText,
        rect: b.getBoundingClientRect(),
        pointerEvents: window.getComputedStyle(b).pointerEvents,
        disabled: b.disabled,
        elementOverIt: (() => {
          const r = b.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return 'zero-size';
          const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return el === b || b.contains(el) ? 'clickable' : (el ? el.tagName + '#' + el.id + '.' + el.className : 'null');
        })()
      }));

      // Test click on nurse modal button
      const nurseBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('คัดกรองพยาบาล'));
      results.nurseBtn = nurseBtn ? {
        text: nurseBtn.innerText,
        rect: nurseBtn.getBoundingClientRect(),
        elementOverIt: (() => {
          const r = nurseBtn.getBoundingClientRect();
          const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return el === nurseBtn || nurseBtn.contains(el) ? 'clickable' : (el ? el.tagName + '#' + el.id + '.' + el.className : 'null');
        })()
      } : 'not found';

      return results;
    })()`,
    returnByValue: true
  });

  console.log('\n--- INTERACTION DIAGNOSTICS ---');
  console.log(JSON.stringify(evalRes.value || evalRes, null, 2));

  // Test triggering changeDisasterMode('wildfire')
  console.log('\n--- TESTING CLICK WILDFIRE ---');
  const fireClickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        if (typeof window.changeDisasterMode === 'function') {
          window.changeDisasterMode('wildfire');
          return { success: true, mode: window.currentDisasterMode };
        } else {
          return { error: 'changeDisasterMode is not a function' };
        }
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    })()`,
    returnByValue: true
  });
  console.log('Wildfire Click Result:', JSON.stringify(fireClickRes.value || fireClickRes, null, 2));

  // Test opening Nurse Modal
  console.log('\n--- TESTING OPEN NURSE MODAL ---');
  const nurseClickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        if (typeof window.switchAppMode === 'function') {
          window.switchAppMode('nurse');
          const modal = document.getElementById('nurse-triage-modal');
          return {
            success: true,
            modalVisible: modal ? window.getComputedStyle(modal).display : 'modal not found'
          };
        } else {
          return { error: 'switchAppMode is not a function' };
        }
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    })()`,
    returnByValue: true
  });
  console.log('Nurse Modal Result:', JSON.stringify(nurseClickRes.value || nurseClickRes, null, 2));

  // Test clicking DOM button directly via element.click()
  console.log('\n--- TESTING DOM BUTTON CLICKS ---');
  const domClickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const results = {};
      const fireBtn = document.getElementById('pill-wildfire');
      if (fireBtn) {
        fireBtn.click();
        results.fireBtnClicked = true;
        results.activePill = document.querySelector('.disaster-pill.active')?.innerText;
      } else {
        results.fireBtnClicked = false;
      }

      const nurseHeaderBtn = document.querySelector('button[onclick*=\"nurse\"]');
      if (nurseHeaderBtn) {
        nurseHeaderBtn.click();
        const modal = document.getElementById('nurse-triage-modal');
        results.nurseHeaderBtnClicked = true;
        results.nurseModalDisplay = modal ? window.getComputedStyle(modal).display : 'not found';
      }
      return results;
    })()`,
    returnByValue: true
  });
  console.log('DOM Click Result:', JSON.stringify(domClickRes.value || domClickRes, null, 2));

  // Take screenshot
  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Volumes/MAC/Thai_Community/click_debug.png', Buffer.from(screenshotRes.data, 'base64'));
  console.log('\nScreenshot saved to click_debug.png');

  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error('Run error:', e);
  chrome.kill();
  process.exit(1);
});
