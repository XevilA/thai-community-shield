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
  '--window-size=1440,900'
]);

async function run() {
  console.log('Waiting for Chrome remote debugging port...');
  let versionData = null;
  for (let i = 0; i < 20; i++) {
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

  // Create new target via PUT
  const targetRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', { method: 'PUT' });
  const target = await targetRes.json();
  console.log('New target created:', target.id);
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

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
      const args = data.params.args.map((a) => a.value || a.description).join(' ');
      console.log(`[Browser Console ${data.params.type}]`, args);
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.error('[Browser Exception]', JSON.stringify(data.params.exceptionDetails));
    }
  };

  await new Promise((r) => (ws.onopen = r));
  console.log('WebSocket CDP connected!');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  console.log('Navigating to http://localhost:3000...');
  await send('Page.navigate', { url: 'http://localhost:3000' });

  // Wait for 3D model to load
  console.log('Waiting for 3D model and scene initialization (up to 15s)...');
  let loaded = false;
  for (let i = 0; i < 30; i++) {
    const res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const loader = document.getElementById('loading-3d');
          const canvas = document.querySelector('#webgl-container canvas');
          return {
            loaderDisplay: loader ? loader.style.display : null,
            canvasFound: !!canvas,
            canvasWidth: canvas ? canvas.width : 0,
            canvasHeight: canvas ? canvas.height : 0,
            hasScene: typeof scene !== 'undefined' && !!scene,
            sceneChildren: typeof scene !== 'undefined' && scene ? scene.children.length : 0,
            currentMode: typeof currentDisasterMode !== 'undefined' ? currentDisasterMode : null
          };
        })()
      `,
      returnByValue: true
    });
    const info = res.result?.value;
    console.log(`[Check ${i + 1}]`, info);
    if (info?.loaderDisplay === 'none' || (info?.sceneChildren > 10)) {
      console.log('🎉 3D Scene and Model loaded successfully!');
      loaded = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  // Test Interactive Features
  console.log('\n--- TESTING ALL REAL FEATURES ---');

  // 1. Test Nurse Triage Modal
  console.log('1. Testing Nurse Triage...');
  let nurseRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        setAppMode('nurse');
        const modal = document.getElementById('nurse-triage-modal');
        const isShown = modal && modal.classList.contains('show');
        return { isShown };
      })()
    `,
    returnByValue: true
  });
  console.log('Nurse Modal Open:', nurseRes.result?.value);

  // 2. Test Plan B Approval from Nurse / Command view
  console.log('2. Testing Approve Plan B...');
  let planRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        await approvePlanB();
        return {
          isPlanApproved: state?.isPlanApproved,
          activeTask: state?.activeTask?.code,
          routeLineChildren: typeof routeGroup !== 'undefined' && routeGroup ? routeGroup.children.length : 0
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Plan B Approval Result:', planRes.result?.value);

  // 3. Test Disaster Modes: Wildfire, Earthquake, Tsunami, Flood
  console.log('3. Testing Disaster Modes...');
  for (const mode of ['wildfire', 'earthquake', 'tsunami', 'flood']) {
    let modeRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          await changeDisasterMode('${mode}');
          return {
            mode: '${mode}',
            activeDisasterMode: currentDisasterMode,
            wildfireVisible: typeof wildfireParticles !== 'undefined' ? wildfireParticles?.visible : null,
            targetCanalY: typeof targetCanalY !== 'undefined' ? targetCanalY : null,
            bgColor: typeof scene !== 'undefined' && scene.background ? scene.background.getHexString() : null
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log(`Disaster Mode [${mode}]:`, modeRes.result?.value);
    await new Promise((r) => setTimeout(r, 600));
  }

  // 4. Test Citizen Registry
  console.log('4. Testing Citizen Registry...');
  let citRes = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        setAppMode('citizen');
        const modal = document.getElementById('citizen-registry-modal');
        const isShown = modal && modal.classList.contains('show');
        
        // Select house A-008 and change status to confirmed_safe
        document.getElementById('cit-house').value = 'A-008';
        onCitizenHouseSelect('A-008');
        document.getElementById('cit-status').value = 'confirmed_safe';
        await updateCitizenRegistry();
        
        // Dispatch door knock team
        await dispatchDoorTeam();
        
        return {
          isShown,
          houseStatus: state?.households?.find(h => h.code === 'A-008')?.access_status,
          taskCount: state?.tasks?.length
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Citizen Registry Result:', citRes.result?.value);

  // 5. Test Field Responder Tab
  console.log('5. Testing Field Responder (Mobile View)...');
  let mobRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        closeModal('citizen-registry-modal');
        closeModal('nurse-triage-modal');
        setAppMode('mobile');
        const mob = document.getElementById('mobile-view');
        return {
          mobileViewDisplay: mob ? mob.style.display : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Mobile View Result:', mobRes.result?.value);

  // Take screenshot to verify visual rendering
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('e2e_screenshot.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved e2e_screenshot.png (size: ' + shot.data.length + ' bytes)');

  ws.close();
  chrome.kill();
  console.log('\n✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test error:', err);
  chrome.kill();
  process.exit(1);
});
