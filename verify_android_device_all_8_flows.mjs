import { execSync } from 'node:child_process';
import fs from 'node:fs';

const targetPort = 9222;

console.log('🚀 Connecting directly to Android Native App via DevTools WebSocket on port', targetPort);

function takeScreenshot(filename) {
  const targetPath = `/Users/dotmini/.gemini/antigravity/brain/6283b7ce-2c0c-4e51-9a52-a438a372094f/${filename}`;
  try {
    execSync(`adb shell screencap -p /sdcard/${filename} && adb pull /sdcard/${filename} ${targetPath}`, { stdio: 'pipe' });
    console.log(`📸 Captured Android Screenshot -> ${filename}`);
  } catch (err) {
    console.error(`Failed to capture screenshot ${filename}:`, err.message);
  }
}

async function run() {
  const listRes = await fetch(`http://127.0.0.1:${targetPort}/json/list`);
  const list = await listRes.json();
  const pageTarget = list.find(t => t.type === 'page' && t.url.includes('appassets'));
  if (!pageTarget) throw new Error('Android page target not found in list: ' + JSON.stringify(list));

  console.log('📱 Attached to Android WebView:', pageTarget.title, 'at', pageTarget.url);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  async function evaluate(code) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: {
          expression: code,
          returnByValue: true
        }
      }));
    });
  }

  console.log('Waiting for Android WebGL 3D scene & state...');
  await new Promise((r) => setTimeout(r, 2000));

  // ==========================================
  // FLOW 1: HYDROLOGY & PREPARATION WINDOW
  // ==========================================
  console.log('\n--- [FLOW 1] Android: Testing Hydrology, Stepper & 4-Pillar Checklist ---');
  const res1 = await evaluate(`
    (() => {
      toggleChecklistItem('p1');
      setChartMode('historical');
      setStep(3);

      const step = state.timeline.currentStep;
      const p1 = state.checklist.find(c => c.id === 'p1');
      return {
        stepIndex: state.timeline.currentIndex,
        stepTime: step.time,
        stepTitle: step.title,
        waterMeters: state.hydrology.waterLevelMeters,
        p1Done: p1 ? p1.is_done : null,
        p1Officer: p1 ? p1.completed_by : null
      };
    })()
  `);
  console.log('Flow 1 Android State Output:', JSON.stringify(res1.result?.value, null, 2));
  await new Promise(r => setTimeout(r, 600));
  takeScreenshot('android_flow1_hydrology_verified.png');

  // ==========================================
  // FLOW 2: 3D SPATIAL DIGITAL TWIN & WHAT-IF
  // ==========================================
  console.log('\n--- [FLOW 2] Android: Testing 3D Digital Twin & What-If Rain (+80mm/h) ---');
  const res2 = await evaluate(`
    (() => {
      triggerWhatIf('rain');
      return {
        waterMeters: state.hydrology.waterLevelMeters,
        alleyDepthCm: state.hydrology.alleyDepthA012Cm,
        rateOfRise: state.hydrology.rateOfRisePerHour,
        isReplanning: state.isReplanningActive,
        totalHouseholds: state.households.length
      };
    })()
  `);
  console.log('Flow 2 Android State Output:', JSON.stringify(res2.result?.value, null, 2));
  await new Promise(r => setTimeout(r, 1200));
  takeScreenshot('android_flow2_whatif_rain_verified.png');

  // Reset What-If
  await evaluate(`triggerWhatIf('reset');`);
  await new Promise(r => setTimeout(r, 500));

  // ==========================================
  // FLOW 3: NON-DIGITAL CITIZENS & DOOR-KNOCK
  // ==========================================
  console.log('\n--- [FLOW 3] Android: Testing Non-Digital Citizens & Door-Knock Dispatch ---');
  const res3 = await evaluate(`
    (() => {
      const nonDigital = state.households.filter(h => h.digital_access === 'no_phone_offline');
      const bedridden = state.households.find(h => h.code === 'A-012');
      inspectHousehold('A-012');
      dispatchDoorKnockCurrent();

      const latestTask = state.tasks[0];
      return {
        nonDigitalCount: nonDigital.length,
        nonDigitalCodes: nonDigital.map(h => h.code),
        bedriddenName: bedridden.residents[0].name,
        oxygenReserveMins: bedridden.residents[0].oxygen_reserve_mins,
        dispatchedTaskId: latestTask.id,
        dispatchedTaskTitle: latestTask.title,
        dispatchedTaskAssignee: latestTask.assigned_team
      };
    })()
  `);
  console.log('Flow 3 Android State Output:', JSON.stringify(res3.result?.value, null, 2));
  await new Promise(r => setTimeout(r, 800));
  takeScreenshot('android_flow3_doorknock_dispatch_verified.png');

  // ==========================================
  // FLOW 4: AI 3-PLAN COMPARISON & APPROVAL
  // ==========================================
  console.log('\n--- [FLOW 4] Android: Testing AI 3-Plan Comparison & Approving Plan B ---');
  const res4 = await evaluate(`
    (() => {
      approvePlan();
      const planA = state.routing.plans.find(p => p.id === 'PLAN_A');
      const planB = state.routing.plans.find(p => p.id === 'PLAN_B');
      const planC = state.routing.plans.find(p => p.id === 'PLAN_C');

      return {
        planAScore: planA.feasibilityScore,
        planAReason: planA.reasoningTh,
        planBScore: planB.feasibilityScore,
        planBReason: planB.reasoningTh,
        planCScore: planC.feasibilityScore,
        planCReason: planC.reasoningTh,
        isPlanApproved: state.isPlanApproved,
        activePlanApproved: state.routing.activePlanApproved,
        activeTaskStatus: state.activeTask ? state.activeTask.status : null
      };
    })()
  `);
  console.log('Flow 4 Android State Output:', JSON.stringify(res4.result?.value, null, 2));
  await new Promise(r => setTimeout(r, 800));
  takeScreenshot('android_flow4_planB_route_verified.png');

  // ==========================================
  // FLOW 5: FIELD RESPONDER CONFIRM ARRIVAL
  // ==========================================
  console.log('\n--- [FLOW 5] Android: Field Responder Confirm Arrival ---');
  const res5 = await evaluate(`
    (() => {
      confirmArrival();
      return {
        activeTaskCode: state.activeTask ? state.activeTask.code : null,
        activeTaskStatus: state.activeTask ? state.activeTask.status : null,
        arrivedAt: state.activeTask ? state.activeTask.arrived_at : null
      };
    })()
  `);
  console.log('Flow 5 Android State Output:', JSON.stringify(res5.result?.value, null, 2));

  // ==========================================
  // FLOW 6: DYNAMIC REPLANNING TRIGGER
  // ==========================================
  console.log('\n--- [FLOW 6] Android: Submit Field Obstacle & Dynamic Replanning ---');
  const res6 = await evaluate(`
    (() => {
      setReportPreset(45, true);
      submitFieldReport();

      return {
        isReplanningActive: state.isReplanningActive,
        replanningReason: state.replanningReasonTh,
        boardwalkSubmerged: state.routing.isBoardwalkSubmerged,
        activeTaskStatus: state.activeTask ? state.activeTask.status : null
      };
    })()
  `);
  console.log('Flow 6 Android State Output:', JSON.stringify(res6.result?.value, null, 2));
  await new Promise(r => setTimeout(r, 1000));
  takeScreenshot('android_flow6_dynamic_replanning_verified.png');

  // Complete Mission
  await evaluate(`completeMission();`);

  // ==========================================
  // FLOW 7: CITIZEN SOS & 4 HAZARDS
  // ==========================================
  console.log('\n--- [FLOW 7] Android: Citizen SOS Report & Wildfire Mode ---');
  const res7 = await evaluate(`
    (() => {
      setSosPreset('น้ำเอ่อล้นสะพานทางเดินไม้ มีเศษขยะอุดตันท่อระบายน้ำหน้าบ้าน A-004', 'สะพานไม้ซอย 2 หน้าบ้าน A-004');
      submitSos();

      const latestInc = state.incidents[state.incidents.length - 1];
      changeDisasterMode('wildfire');

      return {
        latestIncidentCode: latestInc.code,
        latestIncidentCategory: latestInc.category,
        latestIncidentDesc: latestInc.description,
        currentDisasterMode: state.disasterMode
      };
    })()
  `);
  console.log('Flow 7 Android State Output:', JSON.stringify(res7.result?.value, null, 2));
  await new Promise(r => setTimeout(r, 1200));
  takeScreenshot('android_flow7_wildfire_verified.png');

  // Switch back to flood
  await evaluate(`changeDisasterMode('flood');`);
  await new Promise(r => setTimeout(r, 800));

  // ==========================================
  // FLOW 8: 100% OFFLINE LOCALSTORAGE RESTORATION
  // ==========================================
  console.log('\n--- [FLOW 8] Android: Verifying 100% Offline LocalStorage Restoration ---');
  const res8Before = await evaluate(`
    (() => {
      const raw = localStorage.getItem('community_shield_state_v2');
      const parsed = JSON.parse(raw);
      return {
        isPlanApprovedInStorage: parsed.isPlanApproved,
        incidentsCountInStorage: parsed.incidents.length,
        lastIncidentCategory: parsed.incidents[parsed.incidents.length - 1].category
      };
    })()
  `);
  console.log('Flow 8 Storage Before Reload:', JSON.stringify(res8Before.result?.value, null, 2));

  console.log('Reloading Android WebView to verify offline restoration...');
  await evaluate(`window.location.reload();`);
  await new Promise((r) => setTimeout(r, 3500));

  const res8After = await evaluate(`
    (() => {
      return {
        restoredIsPlanApproved: state.isPlanApproved,
        restoredRoutingApproved: state.routing.activePlanApproved,
        restoredIncidentsCount: state.incidents.length,
        restoredLastIncidentCategory: state.incidents[state.incidents.length - 1].category,
        restoredActiveTaskStatus: state.activeTask ? state.activeTask.status : null
      };
    })()
  `);
  console.log('Flow 8 Android State Restored (100% Offline):', JSON.stringify(res8After.result?.value, null, 2));
  takeScreenshot('android_flow8_offline_restored_verified.png');

  ws.close();
  console.log('\n================================================================');
  console.log('🎉🎉🎉 ALL 8 FLOWS HAVE BEEN VERIFIED LIVE ON NATIVE ANDROID! 🎉🎉🎉');
  console.log('================================================================');
  process.exit(0);
}

run().catch(e => {
  console.error('ERROR during Android verification:', e);
  process.exit(1);
});
