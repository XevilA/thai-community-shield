/**
 * High-Performance Bun Master Server for Community Shield (ประชาอารักษ์)
 * Wat Thewarat Kunchorn Community Disaster Resilience System
 * 100% Bun + Native SQLite + Three.js 3D Viewer + Offline Ready
 */

import { initDatabase, db, resetDatabaseToBaseline, getLatestLoraPacket, getAllLoraPackets } from './db';
import { calculateRiverWaterLevel, calculateWaterDepthCm } from './hydrology';
import { explainRiskAssessment, parseCitizenVoiceReport, LORA_AI_SPECS, getLoraAiModelSpecs, runLoraAiAnalysis, queryLoraAiCopilot } from './ai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize SQLite database
initDatabase();

// Timeline definition: 8 key moments of the flood scenario
export const TIMELINE_STEPS = [
  { time: '20:00', minutes: 0, title: 'ตรวจพบระดับน้ำเริ่มสูงขึ้น', desc: 'เซนเซอร์ตรวจวัดได้ 0.42 ม. ฝนตกปานกลาง 35 มม./ชม. น้ำเริ่มเอ่อริมตลิ่ง' },
  { time: '20:10', minutes: 10, title: 'AI Flood Forecast & Preparation Window', desc: 'AI คาดการณ์น้ำแตะ 1.00 ม. เวลา 22:00 น. เริ่มนับถอยหลัง 2 ชั่วโมง พร้อมเช็กลิสต์ 4 ด้าน' },
  { time: '20:15', minutes: 15, title: 'Zone C ลุ่มต่ำปรับเป็นความเสี่ยงสูง', desc: 'พื้นที่ลุ่มต่ำ Zone C ปรับเป็นระดับความเสี่ยงสูง AI วิเคราะห์: แอ่งรับน้ำ + ฝนสะสม + ท่อระบายคอขวด' },
  { time: '20:20', minutes: 20, title: 'สถานการณ์วิกฤต: บ้าน A-012', desc: 'ตรวจพบยายสมจิตร (82 ปี, ติดเตียง) ออกซิเจนสำรองเหลือ 90 นาที น้ำท่วมซอย 35 ซม. รถพยาบาลเข้าไม่ได้' },
  { time: '20:22', minutes: 22, title: 'AI เสนอ 3 แผนการช่วยเหลือ', desc: 'AI วิเคราะห์เส้นทางและเปรียบเทียบ Plan A (15%), Plan B (92% แนะนำ), Plan C (38%)' },
  { time: '20:23', minutes: 23, title: 'เจ้าหน้าที่อนุมัติ Plan B & ออก Task #A-012', desc: 'ผู้บัญชาการกดอนุมัติ Plan B ระบบส่งใบงานมอบหมายทีม Community Team 02 เคลื่อนย้ายผ่านสะพานไม้' },
  { time: '20:30', minutes: 30, title: 'ทีมถึงพื้นที่ & ส่ง Field Report', desc: 'ทีม 02 ถึงบ้าน A-012 รายงานระดับน้ำจริง 45 ซม. ตรวจพบสะพานไม้ทางแยก 2 จมน้ำ' },
  { time: '20:32', minutes: 32, title: 'การปรับเปลี่ยนเส้นทาง: สลับใช้ทางเลี่ยงยกระดับ', desc: 'ระบบตัดสะพานไม้ที่จมน้ำและคำนวณเส้นทางเลี่ยงผ่านหน้าศูนย์ชุมชน นำส่งผู้ป่วยต่อรถ EMS สำเร็จ' },
];

let currentStepIndex = 0;
let boardwalkSubmerged = false;
let isPlanApproved = false;
let activeTask: any = null;
let currentDisasterMode: 'flood' | 'earthquake' | 'wildfire' | 'tsunami' = 'flood';

export function getDisasterData(mode: string, step: any) {
  if (mode === 'earthquake') {
    return {
      type: 'earthquake',
      titleTh: 'แผ่นดินไหวขนาด 6.2 ริกเตอร์ (Seismic Tremor)',
      magnitude: 6.2,
      depthKm: 10,
      epicenter: 'รอยเลื่อนศรีสวัสดิ์-กาญจนบุรี (ห่าง 145 กม.)',
      pga: 0.28,
      intensityMmi: 'VII (Very Strong - อาคารสั่นไหวรุนแรง)',
      structuralDamageRisk: 'สะพานไม้เก่าทางแยก 2 เสี่ยงแตกหัก เสาไฟฟ้าริมซอยเอียง',
      assemblyPoint: 'ลานโล่งหน้าวัดเทวราชกุญชร (Open Plaza Assembly Point)',
      seismicWaveStatus: 'S-wave Arrival (กำลังสั่นสะเทือนต่อเนื่อง)',
      recommendedAction: 'หมอบ กำบัง ยึด (Drop, Cover, Hold on) แล้วอพยพสู่ที่โล่งแจ้งทันที หลีกเลี่ยงชายคาและสะพานไม้'
    };
  }
  if (mode === 'wildfire') {
    return {
      type: 'wildfire',
      titleTh: 'อัคคีภัยชุมชน & ไฟลุกลามตามลม (Urban Wildfire)',
      fireSpreadRateMpm: 14.2,
      windSpeedKmh: 28,
      windDirection: 'SW (ลมตะวันตกเฉียงใต้พัดเข้า Zone B/C)',
      pm25Aqi: 410,
      fireFrontDistanceM: 75,
      combustionRisk: 'สิ่งปลูกสร้างไม้เก่าติดไฟง่าย มีถังแก๊สตามบ้าน',
      fireHydrantReady: 'หัวจ่ายน้ำดับเพลิงหน้าวัดเทวราช 2 จุด พร้อมใช้งาน',
      recommendedAction: 'ตัดระบบไฟฟ้าชุมชน อพยพออกเส้นทางเหนือลม (Upwind Route) มุ่งหน้าถนนใหญ่'
    };
  }
  if (mode === 'tsunami') {
    return {
      type: 'tsunami',
      titleTh: 'คลื่นยักษ์สึนามิ & คลื่นพายุซัดฝั่ง (Tsunami & Estuary Surge)',
      surgeHeightMeters: 4.5,
      estimatedTimeOfArrivalMins: 12,
      inundationDistanceMeters: 350,
      tideSurgeSpeedKmh: 48,
      coastalStatus: 'ระดับน้ำตลิ่งลดฮวบฉับพลัน (Harbor Receding Phase) ก่อนคลื่นยักษ์ยกตัว',
      evacuationStrategy: 'Vertical Evacuation (อพยพขึ้นชั้น 3-4 อาคารคอนกรีตวัดเทวราชทันที ห้ามหนีในตรอกราบ)',
      warningTier: 'RED CRITICAL (แจ้งเตือนสึนามิระดับสูงสุด - ให้อพยพทันที)'
    };
  }
  return {
    type: 'flood',
    titleTh: 'อุทกภัยน้ำหนุนแม่น้ำเจ้าพระยา & น้ำเหนือไหลหลาก (Chao Phraya River Inundation)',
    riverLevelM: 0.42 + (step?.minutes || 0) * 0.015,
    floodStatus: 'น้ำหนุนแม่น้ำเจ้าพระยาและน้ำเหนือไหลหลาก',
    recommendedAction: 'ยกสิ่งของขึ้นที่สูง เคลื่อนย้ายผู้ป่วยติดเตียงตามแผน B'
  };
}

// Connected WebSocket clients
const wsClients = new Set<any>();

function broadcast(event: string, data: any) {
  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  for (const client of wsClients) {
    try {
      client.send(payload);
    } catch {
      wsClients.delete(client);
    }
  }
}

export function getSystemState(stepOverride?: number) {
  const effectiveIndex = typeof stepOverride === 'number' ? stepOverride : currentStepIndex;
  const step = TIMELINE_STEPS[effectiveIndex];
  const hydro = calculateRiverWaterLevel(step.minutes);

  // If step >= 20:30 or boardwalk explicitly reported submerged
  const isSubmerged = boardwalkSubmerged || step.time >= '20:30';
  const submergedSet = new Set<string>();
  if (isSubmerged) {
    submergedSet.add('NODE_BOARDWALK_J2');
    submergedSet.add('E2');
    submergedSet.add('E3');
  }

  // Update house A-012 in DB if critical
  if (step.time >= '20:20') {
    db.run("UPDATE households SET access_status = 'critical_help_needed', area_risk = 'critical' WHERE code = 'A-012'");
  }

  // Evaluate All 3 Plans with real Dijkstra
  const planEvals = evaluateAllPlans(hydro.level, submergedSet);

  // Active Evacuation Route for House A-012 to Medical Point B
  const activeRoute = findShortestPath(
    'NODE_HOUSE_A012',
    'NODE_MEDICAL_POINT_B',
    hydro.level,
    'stretcher',
    submergedSet
  );

  // Query households, residents, checklist from SQLite
  const rawHouseholds = db.query('SELECT * FROM households').all();
  const residents = db.query('SELECT * FROM residents').all();
  const checklist = db.query('SELECT * FROM checklist_items ORDER BY rowid ASC').all();
  const incidents = db.query('SELECT * FROM incidents ORDER BY reported_at DESC').all();
  const tasks = db.query('SELECT * FROM tasks ORDER BY created_at DESC').all();
  const nurseNotes = db.query('SELECT * FROM nurse_notes ORDER BY recorded_at DESC').all();

  // Attach residents and live flood depth to each household
  const households = rawHouseholds.map((h: any) => {
    const r = residents.filter((res: any) => res.household_code === h.code);
    const depthCm = calculateWaterDepthCm(hydro.level, h.alley_elevation);
    return { ...h, residents: r, currentAlleyDepthCm: depthCm };
  });

  // Water depth in alley front of A-012 (elevation 0.05m)
  const alleyDepthA012 = calculateWaterDepthCm(hydro.level, 0.05);

  // AI Explainability for House A-012
  const aiExplanation = explainRiskAssessment({
    houseCode: 'A-012',
    waterLevelMeters: hydro.level,
    rateOfRisePerHour: hydro.rateOfRise,
    rainfallMm: hydro.rainfall,
    alleyElevation: 0.05,
    bedridden: true,
    requiresOxygen: true,
    oxygenReserveMins: Math.max(30, 90 - step.minutes),
    digitalAccess: 'no_phone_offline',
    isBoardwalkSubmerged: isSubmerged,
  });

  return {
    timeline: {
      steps: TIMELINE_STEPS,
      currentIndex: currentStepIndex,
      currentStep: step,
    },
    hydrology: {
      waterLevelMeters: hydro.level,
      rateOfRisePerHour: hydro.rateOfRise,
      rainfallMm: hydro.rainfall,
      alleyDepthA012Cm: alleyDepthA012,
      criticalThresholdMeters: 1.0,
    },
    disasterMode: currentDisasterMode,
    disasterData: getDisasterData(currentDisasterMode, step),
    plans: planEvals,
    activeRoute,
    isPlanApproved: isPlanApproved || step.time >= '20:23',
    activeTask: activeTask || (tasks.length > 0 ? tasks[0] : null),
    isReplanningActive: isSubmerged,
    replanningReasonTh: isSubmerged
      ? 'ตรวจพบสะพานไม้ทางแยก 2 จมน้ำลึกเกินเกณฑ์ปลอดภัย ระบบได้สลับไปใช้เส้นทางเลี่ยงยกระดับผ่านหน้าศูนย์ชุมชน (Plaza Forecourt) เรียบร้อยแล้ว'
      : '',
    households,
    checklist,
    residents,
    incidents,
    tasks,
    nurseNotes,
    lineBroadcasts: db.query('SELECT * FROM line_broadcasts ORDER BY id DESC').all(),
    lora: (() => {
      const latestLora = getLatestLoraPacket();
      return {
        gatewayId: 'GW-THEWARAT-BELF-01',
        gatewayName: 'เกตเวย์หอระฆังวัดเทวราชกุญชร (Belfry Gateway)',
        nodeDevEui: '70-B3-D5-7E-D0-04-A1-2F',
        nodeName: 'เซนเซอร์วัดระดับน้ำท่าน้ำเจ้าพระยา (Pier Node 01)',
        standard: 'AS923-TH (กสทช.)',
        frequencyMhz: latestLora ? latestLora.frequency_mhz : 923.2,
        rssiDbm: latestLora ? latestLora.rssi_dbm : -78,
        snrDb: latestLora ? latestLora.snr_db : 9.5,
        spreadingFactor: latestLora ? latestLora.spreading_factor : 'SF9BW125',
        fCnt: latestLora ? latestLora.f_cnt : 1482,
        batteryVolts: latestLora ? latestLora.battery_volts : 3.62,
        batteryPct: latestLora ? latestLora.battery_pct : 94,
        waterLevelM: latestLora ? latestLora.water_level_m : hydro.level,
        tempC: latestLora ? latestLora.temp_c : 28.4,
        rawPayload: latestLora ? latestLora.raw_payload : '010201A40267011C03020E38',
        status: 'online',
        lastPacketTime: latestLora ? latestLora.timestamp_time : step.time,
        packetLossPct: 0.08,
        totalPackets: 1482,
      };
    })(),
    aiExplanation,
  };
}

try {
  const srcHtml = path.resolve('/Volumes/MAC/Thai_Community/public/index.html');
  const dstHtml = path.resolve('/Volumes/MAC/Thai_Community/server/public/index.html');
  if (fs.existsSync(srcHtml)) {
    fs.copyFileSync(srcHtml, dstHtml);
  }
} catch (_) {}

const PORT = Number(process.env.PORT || 3000);

const server = (Bun as any).serve({
  port: PORT,
  hostname: '0.0.0.0',
  fetch(req: Request, serverRef: any) {
    const url = new URL(req.url);

    // 1. WebSocket Upgrade
    if (url.pathname === '/ws') {
      const upgraded = serverRef.upgrade(req);
      if (upgraded) return undefined;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data, null, 2), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    try {
      // 2. Serve 3D GLB Model (model.glb & thai_community_visible_low_areas.glb)
      if (url.pathname === '/model.glb' || url.pathname === '/thai_community_visible_low_areas.glb') {
        const p1 = '/Volumes/MAC/Thai_Community/public/model.glb';
        const p2 = '/Volumes/MAC/Thai_Community/thai_community_visible_low_areas.glb';
        const targetPath = fs.existsSync(p1) ? p1 : p2;
        const glbFile = Bun.file(targetPath);
        return new Response(glbFile, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'model/gltf-binary',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      // 3. Serve Vendor Libraries (Three.js, GLTFLoader, OrbitControls)
      if (url.pathname.startsWith('/vendor/')) {
        const fileName = path.basename(url.pathname);
        let filePath = path.join('/Volumes/MAC/Thai_Community/vendor', fileName);
        if (!fs.existsSync(filePath)) {
          filePath = path.join('/Volumes/MAC/Thai_Community/public/vendor', fileName);
        }
        if (fs.existsSync(filePath)) {
          const file = Bun.file(filePath);
          return new Response(file, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/javascript',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      }

      // 4. API Endpoints
      if (url.pathname === '/api/health') {
        return json({ status: 'ok', engine: 'Bun + Native SQLite', time: new Date().toISOString() });
      }

      if (url.pathname === '/api/state') {
        return json(getSystemState());
      }

      if (url.pathname === '/api/step' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const newIndex = typeof body.stepIndex === 'number' ? body.stepIndex : currentStepIndex + 1;
          if (newIndex >= 0 && newIndex < TIMELINE_STEPS.length) {
            currentStepIndex = newIndex;
            if (TIMELINE_STEPS[currentStepIndex].time >= '20:30') {
              boardwalkSubmerged = true;
            } else {
              boardwalkSubmerged = false;
            }
            if (TIMELINE_STEPS[currentStepIndex].time < '20:23') {
              isPlanApproved = false;
            }
            const state = getSystemState();
            broadcast('STATE_UPDATED', state);
            return json(state);
          }
          return json({ error: 'Invalid step index' }, 400);
        })();
      }

      // Approve Plan
      if (url.pathname === '/api/approve-plan' && req.method === 'POST') {
        isPlanApproved = true;
        const taskCode = 'TASK #A-012';
        db.run(`
          INSERT OR REPLACE INTO tasks (
            id, code, incident_id, priority, title, mission_objective,
            target_household, assigned_team, destination_point, status, created_at, accepted_at
          ) VALUES (
            'task-a012', '${taskCode}', 'inc-001', 'critical',
            'เคลื่อนย้ายผู้ป่วยติดเตียงบ้าน A-012 (ยายสมจิตร)',
            'ใช้เปลสนามเดินเท้าบนสะพานไม้ยกสูง นำผู้ป่วยและถังออกซิเจนสำรองมายังจุดส่งต่อการแพทย์ Medical Point B',
            'A-012', 'Community Team 02', 'จุดส่งต่อการแพทย์ B (หน้าวัดเทวราชกุญชร)',
            'accepted', '20:23', '20:24'
          );
        `);
        activeTask = db.query("SELECT * FROM tasks WHERE code = 'TASK #A-012'").get();
        const state = getSystemState();
        broadcast('STATE_UPDATED', state);
        return json({ success: true, task: activeTask });
      }

      // Reset Plan B Approval
      if (url.pathname === '/api/plan/reset' && req.method === 'POST') {
        isPlanApproved = false;
        db.run("DELETE FROM tasks WHERE code = 'TASK #A-012'");
        activeTask = null;
        const state = getSystemState();
        broadcast('STATE_UPDATED', state);
        return json({ success: true, state });
      }

      // Toggle Checklist Item in SQLite
      if (url.pathname === '/api/checklist/toggle' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const id = body.id;
          if (id) {
            const currentItem: any = db.query('SELECT is_done FROM checklist_items WHERE id = ?').get(id);
            const newDone = currentItem && currentItem.is_done ? 0 : 1;
            const nowTime = TIMELINE_STEPS[currentStepIndex].time;
            db.run(
              'UPDATE checklist_items SET is_done = ?, completed_at = ?, completed_by = ? WHERE id = ?',
              [newDone, newDone ? nowTime : null, newDone ? 'เจ้าหน้าที่ศูนย์บัญชาการ' : null, id]
            );
            const state = getSystemState();
            broadcast('STATE_UPDATED', state);
            return json({ success: true, id, is_done: newDone, state });
          }
          return json({ error: 'Missing item id' }, 400);
        })();
      }

      // Update Household Status in SQLite
      if (url.pathname === '/api/household/status' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const { code, access_status, area_risk } = body;
          if (code && access_status) {
            if (area_risk) {
              db.run('UPDATE households SET access_status = ?, area_risk = ? WHERE code = ?', [access_status, area_risk, code]);
            } else {
              db.run('UPDATE households SET access_status = ? WHERE code = ?', [access_status, code]);
            }
            const state = getSystemState();
            broadcast('STATE_UPDATED', state);
            return json({ success: true, code, access_status, state });
          }
          return json({ error: 'Missing parameters' }, 400);
        })();
      }

      // Dispatch Door-knock / Inspection Team
      if (url.pathname === '/api/household/dispatch' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const { code, team = 'Community Team 01', reason = 'เคาะประตูสำรวจความปลอดภัยและส่งสิ่งของจำเป็น' } = body;
          if (code) {
            const taskId = `task-door-${code.toLowerCase()}-${Date.now()}`;
            const taskCode = `TASK #DOOR-${code}`;
            const nowTime = TIMELINE_STEPS[currentStepIndex].time;
            db.run(`
              INSERT INTO tasks (
                id, code, incident_id, priority, title, mission_objective,
                target_household, assigned_team, destination_point, status, created_at, accepted_at
              ) VALUES (
                $id, $code, 'inc-001', 'medium',
                $title, $objective, $target, $team, $dest, 'accepted', $now, $now
              );
            `, {
              $id: taskId,
              $code: taskCode,
              $title: `ทีมสำรวจเคาะประตูบ้าน ${code}`,
              $objective: reason,
              $target: code,
              $team: team,
              $dest: `บ้าน ${code}`,
              $now: nowTime,
            });
            const state = getSystemState();
            broadcast('STATE_UPDATED', state);
            return json({ success: true, taskCode, state });
          }
          return json({ error: 'Missing household code' }, 400);
        })();
      }

      // Full Demo Reset back to 20:00 Baseline
      if (url.pathname === '/api/reset-demo' && req.method === 'POST') {
        currentStepIndex = 0;
        boardwalkSubmerged = false;
        isPlanApproved = false;
        activeTask = null;
        resetDatabaseToBaseline();
        const state = getSystemState();
        broadcast('STATE_UPDATED', state);
        return json({ success: true, state });
      }

      // Update Task Status
      if (url.pathname === '/api/task/status' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const newStatus = body.status;
          const taskCode = body.code || 'TASK #A-012';
          const nowTime = TIMELINE_STEPS[currentStepIndex].time;
          if (newStatus === 'arrived') {
            db.run("UPDATE tasks SET status = ?, arrived_at = ? WHERE code = ?", [newStatus, nowTime, taskCode]);
          } else if (newStatus === 'completed') {
            db.run("UPDATE tasks SET status = ?, completed_at = ? WHERE code = ?", [newStatus, nowTime, taskCode]);
          } else {
            db.run("UPDATE tasks SET status = ? WHERE code = ?", [newStatus, taskCode]);
          }
          activeTask = db.query("SELECT * FROM tasks WHERE code = ?", [taskCode]).get();
          const state = getSystemState();
          broadcast('STATE_UPDATED', state);
          return json({ success: true, task: activeTask, state });
        })();
      }

      // Submit Field Report with Dynamic Replanning Trigger
      if (url.pathname === '/api/field-report' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const depthCm = body.depthCm || 45;
          const isSubmerged = body.isBridgeSubmerged ?? true;

          if (isSubmerged) {
            boardwalkSubmerged = true;
            currentStepIndex = 7; // Advance to 20:32
          }

          db.run(`
            INSERT INTO field_reports (
              id, task_id, submitted_at, team_code, actual_water_depth_cm,
              alley_passable, boardwalk_safe, patient_condition, gps_lat, gps_lng,
              triggers_replanning, replanning_reason
            ) VALUES (
              $id, 'task-a012', '20:30', 'Community Team 02', $depth,
              1, $safe, 'ผู้ป่วยสัญญาณชีพปกติ ออกซิเจนเหลือพอ', 13.7712, 100.5015,
              $triggers, $reason
            );
          `, {
            $id: `rep-${Date.now()}`,
            $depth: depthCm,
            $safe: isSubmerged ? 0 : 1,
            $triggers: isSubmerged ? 1 : 0,
            $reason: isSubmerged ? 'สะพานไม้ชั่วคราวทางแยก 2 จมน้ำ 45 ซม.' : 'ทางเดินปกติ',
          });

          db.run("UPDATE tasks SET status = 'reported' WHERE code = 'TASK #A-012'");
          activeTask = db.query("SELECT * FROM tasks WHERE code = 'TASK #A-012'").get();

          const state = getSystemState();
          broadcast('STATE_UPDATED', state);
          return json({ success: true, state });
        })();
      }

      
      // Change Disaster Mode
      if (url.pathname === '/api/disaster-mode' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const mode = body.mode;
          if (['flood', 'earthquake', 'wildfire', 'tsunami'].includes(mode)) {
            currentDisasterMode = mode;
            const state = getSystemState();
            broadcast('STATE_UPDATED', state);
            return json({ success: true, mode, state });
          }
          return json({ error: 'Invalid mode' }, 400);
        })();
      }

      // Citizen Voice/Text SOS
      if (url.pathname === '/api/voice-sos' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const text = body.text || 'น้ำดันเข้าท่อหน้าบ้านแล้ว ช่วยด้วย';
          const loc = body.location || 'ชุมชนวัดเทวราชกุญชร ซอย 2';
          const parsed = parseCitizenVoiceReport(text, loc);

          const incCode = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
          db.run(`
            INSERT INTO incidents (id, code, category, severity, status, reported_at, location_name, description, current_water_depth_cm)
            VALUES ($id, $code, $cat, $sev, 'open', '20:25', $loc, $desc, 30);
          `, {
            $id: `inc-${Date.now()}`,
            $code: incCode,
            $cat: parsed.category,
            $sev: parsed.severity,
            $loc: parsed.parsedLocation,
            $desc: text,
          });

          const state = getSystemState();
          broadcast('STATE_UPDATED', state);
          return json({ success: true, parsed, incCode });
        })();
      }

      // --- LINE Notification & Broadcast Engine ---
      if (url.pathname === '/api/line/broadcast' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const title = body.title || 'แจ้งเตือนภัยพิบัติระดับชุมชน (Community Shield)';
          const message = body.message || 'โปรดติดตามสถานการณ์ระดับน้ำและปฏิบัติตามคำแนะนำของศูนย์บัญชาการ';
          const hazardType = body.hazardType || body.hazard_type || currentDisasterMode || 'flood';
          const targetAudience = body.targetAudience || body.target_audience || 'all_community';
          const userToken = body.channelAccessToken || body.channel_access_token || process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
          const nowTime = TIMELINE_STEPS[currentStepIndex].time;
          const broadcastId = `lb-${Date.now()}`;
          
          let deliveryReceipt = `LINE_SIM_${Date.now()}`;
          let status = 'sent';
          let realApiStatus = null;

          // If a real token is provided, attempt actual LINE Messaging API Broadcast
          if (userToken && userToken.trim().length > 10) {
            try {
              const flexPayload = {
                messages: [
                  {
                    type: 'flex',
                    altText: `[ด่วน] ${title}`,
                    contents: {
                      type: 'bubble',
                      header: {
                        type: 'box',
                        layout: 'vertical',
                        backgroundColor: hazardType === 'flood' ? '#0071E3' : hazardType === 'wildfire' ? '#EA580C' : hazardType === 'tsunami' ? '#0284C7' : '#D97706',
                        contents: [
                          { type: 'text', text: '🛡️ ประชาอารักษ์ — แจ้งเตือนภัยชุมชน', color: '#FFFFFF', size: 'xs', weight: 'bold' },
                          { type: 'text', text: title, color: '#FFFFFF', size: 'md', weight: 'bold', wrap: true, margin: 'xs' }
                        ]
                      },
                      body: {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                          { type: 'text', text: message, wrap: true, size: 'sm', color: '#333333' },
                          { type: 'separator', margin: 'md' },
                          {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'md',
                            spacing: 'sm',
                            contents: [
                              {
                                type: 'box',
                                layout: 'baseline',
                                contents: [
                                  { type: 'text', text: 'เวลาแจ้งเตือน:', size: 'xs', color: '#888888', flex: 2 },
                                  { type: 'text', text: `${nowTime} น. (10 ต.ค. 2569)`, size: 'xs', color: '#111111', flex: 4 }
                                ]
                              },
                              {
                                type: 'box',
                                layout: 'baseline',
                                contents: [
                                  { type: 'text', text: 'พื้นที่เป้าหมาย:', size: 'xs', color: '#888888', flex: 2 },
                                  { type: 'text', text: 'ชุมชนวัดเทวราชกุญชร เขตดุสิต', size: 'xs', color: '#111111', flex: 4 }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      footer: {
                        type: 'box',
                        layout: 'vertical',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'button',
                            style: 'primary',
                            color: '#0071E3',
                            action: { type: 'uri', label: 'ดูแผนผัง 3D และเส้นทางเลี่ยง', uri: 'https://thai-community-shield.vercel.app' }
                          },
                          {
                            type: 'button',
                            style: 'secondary',
                            action: { type: 'uri', label: 'โทรสายด่วนเขตดุสิต (02-243-5311)', uri: 'tel:022435311' }
                          }
                        ]
                      }
                    }
                  }
                ]
              };

              const lineRes = await fetch('https://api.line.me/v2/bot/message/broadcast', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${userToken.trim()}`
                },
                body: JSON.stringify(flexPayload)
              });
              realApiStatus = lineRes.status;
              if (lineRes.ok) {
                deliveryReceipt = `LINE_LIVE_${Date.now()}`;
              } else {
                deliveryReceipt = `LINE_LIVE_ERR_${lineRes.status}`;
              }
            } catch (netErr: any) {
              deliveryReceipt = `LINE_NET_ERR: ${netErr.message}`;
            }
          }

          const recipients = targetAudience === 'field_teams' ? 14 : targetAudience === 'caregivers' ? 16 : 248;

          db.run(`
            INSERT INTO line_broadcasts (id, sent_at, hazard_type, target_audience, title, message, recipients_count, status, delivery_receipt)
            VALUES ($id, $sent_at, $hazard_type, $target_audience, $title, $message, $recipients, $status, $delivery_receipt);
          `, {
            $id: broadcastId,
            $sent_at: nowTime,
            $hazard_type: hazardType,
            $target_audience: targetAudience,
            $title: title,
            $message: message,
            $recipients: recipients,
            $status: status,
            $delivery_receipt: deliveryReceipt
          });

          const state = getSystemState();
          broadcast('LINE_ALERT_BROADCASTED', {
            id: broadcastId,
            sent_at: nowTime,
            hazard_type: hazardType,
            target_audience: targetAudience,
            title,
            message,
            recipients,
            deliveryReceipt,
            realApiStatus
          });
          broadcast('STATE_UPDATED', state);

          return json({
            success: true,
            broadcastId,
            sent_at: nowTime,
            recipients_count: recipients,
            deliveryReceipt,
            realApiStatus,
            state
          });
        })();
      }

      if (url.pathname === '/api/line/message' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const target = body.target || body.target_audience || 'field_teams';
          const title = body.title || 'มอบหมายงานกู้ชีพผ่าน LINE';
          const message = body.message || 'มอบหมายงานเร่งด่วน กรุณาตรวจสอบและดำเนินการ';
          const hazardType = body.hazardType || body.hazard_type || currentDisasterMode || 'flood';
          const nowTime = TIMELINE_STEPS[currentStepIndex].time;
          const msgId = `lm-${Date.now()}`;
          const receipt = `LINE_DIRECT_${Date.now()}`;

          db.run(`
            INSERT INTO line_broadcasts (id, sent_at, hazard_type, target_audience, title, message, recipients_count, status, delivery_receipt)
            VALUES ($id, $sent_at, $hazard, $target, $title, $message, 1, 'sent', $receipt);
          `, {
            $id: msgId,
            $sent_at: nowTime,
            $hazard: hazardType,
            $target: target,
            $title: title,
            $message: message,
            $receipt: receipt
          });

          const state = getSystemState();
          broadcast('LINE_ALERT_BROADCASTED', {
            id: msgId,
            sent_at: nowTime,
            hazard_type: hazardType,
            target_audience: target,
            title,
            message,
            recipients: 1,
            deliveryReceipt: receipt
          });
          broadcast('STATE_UPDATED', state);
          return json({ success: true, msgId, sent_at: nowTime, deliveryReceipt: receipt, state });
        })();
      }

      if (url.pathname === '/api/line/history') {
        const history = db.query('SELECT * FROM line_broadcasts ORDER BY id DESC').all();
        return json({ history });
      }

      // --- LoRaWAN Telemetry & Packets Engine (Section 37) ---
      if (url.pathname === '/api/lora/status') {
        const latestLora = getLatestLoraPacket();
        const packets = getAllLoraPackets(15);
        return json({
          status: 'online',
          architecture: 'Section 37: Water Sensor -> LoRa -> Community Gateway -> SQLite DB -> AI Forecast -> Risk Map -> Response Task -> Sync',
          gateway: {
            id: 'GW-THEWARAT-BELF-01',
            location: 'หอระฆังวัดเทวราชกุญชร เขตดุสิต (Belfry Tower)',
            antenna: 'High-Gain Fiberglass Collinear 5.8 dBi',
            backhaul: 'Cellular 4G LTE + Local Ethernet + Offline Buffer',
            status: 'operational',
            uptime: '99.98%'
          },
          node: {
            devEui: '70-B3-D5-7E-D0-04-A1-2F',
            appEui: '00-00-00-00-00-00-00-00',
            location: 'ท่าน้ำวัดเทวราชกุญชร ริมแม่น้ำเจ้าพระยา (Chao Phraya Pier)',
            transducer: 'IP67 Submersible Ultrasonic & Hydrostatic Transducer',
            solarAssisted: true,
            batteryPct: latestLora ? latestLora.battery_pct : 94,
            batteryVolts: latestLora ? latestLora.battery_volts : 3.62
          },
          rf: {
            standard: 'AS923-TH (กสทช.)',
            frequencyMhz: latestLora ? latestLora.frequency_mhz : 923.2,
            bandwidthKhz: 125,
            spreadingFactor: latestLora ? latestLora.spreading_factor : 'SF9BW125',
            rssiDbm: latestLora ? latestLora.rssi_dbm : -78,
            snrDb: latestLora ? latestLora.snr_db : 9.5
          },
          latestPacket: latestLora,
          packetHistory: packets,
          loraAiModel: LORA_AI_SPECS,
          loraAiAnalysis: runLoraAiAnalysis(latestLora, getSystemState())
        });
      }

      if (url.pathname === '/api/lora/ping' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const step = TIMELINE_STEPS[currentStepIndex];
          const hydro = calculateRiverWaterLevel(step.minutes);
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          
          const waterLevel = Number((hydro.level + (Math.random() * 0.02 - 0.01)).toFixed(2));
          const waterLevelDm = Math.max(0, Math.round(waterLevel * 100));
          const waterHex = waterLevelDm.toString(16).padStart(4, '0').toUpperCase();
          const tempC = Number((28.0 + (Math.random() * 0.6 - 0.3)).toFixed(1));
          const tempHex = Math.round(tempC * 10).toString(16).padStart(4, '0').toUpperCase();
          const batV = Number((3.60 + Math.random() * 0.04).toFixed(2));
          const batMv = Math.round(batV * 1000);
          const batHex = batMv.toString(16).padStart(4, '0').toUpperCase();
          const rawPayload = `0102${waterHex}0267${tempHex}0302${batHex}`;

          const pktId = `lora-pkt-${Date.now()}`;
          const fCnt = Math.floor(1483 + Math.random() * 50);
          const freqs = [923.2, 923.4, 923.6];
          const freq = freqs[Math.floor(Math.random() * freqs.length)];
          const rssi = Math.floor(-75 - Math.random() * 8);
          const snr = Number((9.0 + Math.random() * 1.5).toFixed(1));

          db.run(`
            INSERT INTO lora_packets (
              id, timestamp_time, dev_eui, gateway_id, frequency_mhz, rssi_dbm, snr_db,
              spreading_factor, f_cnt, battery_volts, battery_pct, water_level_m, temp_c, raw_payload, status
            ) VALUES (
              $id, $timestamp_time, $dev_eui, $gateway_id, $frequency_mhz, $rssi_dbm, $snr_db,
              $spreading_factor, $f_cnt, $battery_volts, $battery_pct, $water_level_m, $temp_c, $raw_payload, 'synced'
            );
          `, {
            $id: pktId,
            $timestamp_time: timeStr,
            $dev_eui: '70-B3-D5-7E-D0-04-A1-2F',
            $gateway_id: 'GW-THEWARAT-BELF-01',
            $frequency_mhz: freq,
            $rssi_dbm: rssi,
            $snr_db: snr,
            $spreading_factor: 'SF9BW125',
            $f_cnt: fCnt,
            $battery_volts: batV,
            $battery_pct: 94,
            $water_level_m: waterLevel,
            $temp_c: tempC,
            $raw_payload: rawPayload
          });

          const newPacket = db.query('SELECT * FROM lora_packets WHERE id = ?').get(pktId);
          const state = getSystemState();

          broadcast('LORA_PACKET_RECEIVED', {
            packet: newPacket,
            event: 'UPLINK_TRANSMITTED',
            telemetry: { waterLevel, tempC, batV, rssi, snr, freq }
          });
          broadcast('STATE_UPDATED', state);

          return json({ success: true, packet: newPacket, state });
        })();
      }

      if (url.pathname === '/api/lora/history') {
        const packets = getAllLoraPackets(50);
        return json({ packets });
      }

      // --- LoRA (Low-Rank Adaptation) AI Engine & Decision Copilot ---
      if (url.pathname === '/api/lora/ai-model') {
        return json({
          success: true,
          model: getLoraAiModelSpecs()
        });
      }

      if (url.pathname === '/api/lora/ai-analyze' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const state = getSystemState();
          const latestLora = getLatestLoraPacket();
          const packetToAnalyze = body.packet || latestLora;
          const analysis = runLoraAiAnalysis(packetToAnalyze, state);
          return json({
            success: true,
            model: LORA_AI_SPECS.adapterName,
            analysis
          });
        })();
      }

      if (url.pathname === '/api/lora/ai-query' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const state = getSystemState();
          const query = body.query || 'วิเคราะห์ระดับน้ำจาก LoRa ล่าสุด';
          const copilotResult = queryLoraAiCopilot(query, state);
          return json({
            success: true,
            query,
            ...copilotResult
          });
        })();
      }

      // 5. Serve PWA Manifest, Service Worker & Static Assets
      if (url.pathname === '/manifest.json') {
        const manifestPath = path.resolve('/Volumes/MAC/Thai_Community/server/public/manifest.json');
        if (fs.existsSync(manifestPath)) {
          return new Response(Bun.file(manifestPath), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/manifest+json; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }

      if (url.pathname === '/sw.js') {
        const swPath = path.resolve('/Volumes/MAC/Thai_Community/server/public/sw.js');
        if (fs.existsSync(swPath)) {
          return new Response(Bun.file(swPath), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Service-Worker-Allowed': '/',
            },
          });
        }
      }

      if (url.pathname === '/icon.svg') {
        const iconPath = path.resolve('/Volumes/MAC/Thai_Community/server/public/icon.svg');
        if (fs.existsSync(iconPath)) {
          return new Response(Bun.file(iconPath), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      }

      // 6. Serve the Master Universal Web & Mobile Application
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const publicHtml = path.resolve('/Volumes/MAC/Thai_Community/public/index.html');
        const serverHtml = path.resolve('/Volumes/MAC/Thai_Community/server/public/index.html');
        try {
          if (fs.existsSync(publicHtml)) {
            fs.copyFileSync(publicHtml, serverHtml);
          }
        } catch (_) {}
        const htmlPath = fs.existsSync(publicHtml) ? publicHtml : serverHtml;
        if (fs.existsSync(htmlPath)) {
          return new Response(Bun.file(htmlPath), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      }

      return new Response('Not Found', { status: 404 });
    } catch (err: any) {
      console.error('Server error:', err);
      return json({ error: err?.message || 'Server error' }, 500);
    }
  },
  websocket: {
    open(ws: any) {
      wsClients.add(ws);
      ws.send(JSON.stringify({ event: 'CONNECTED', data: { message: 'Community Shield Live Bus Connected' } }));
    },
    message(ws: any, msg: string) {
      // Echo / ping-pong
    },
    close(ws: any) {
      wsClients.delete(ws);
    },
  },
});

const networkInterfaces = os.networkInterfaces();
const lanIps: string[] = [];
for (const ifaceList of Object.values(networkInterfaces)) {
  if (ifaceList) {
    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lanIps.push(iface.address);
      }
    }
  }
}

console.log(`=======================================================`);
console.log(`🛡️  COMMUNITY SHIELD (ประชาอารักษ์) — PRODUCTION DEPLOYMENT`);
console.log(`    Wat Thewarat Kunchorn Community Disaster Resilience`);
console.log(`=======================================================`);
console.log(`🖥️  Local Host:     http://localhost:${PORT}`);
if (lanIps.length > 0) {
  lanIps.forEach((ip) => {
    console.log(`📱  Field LAN:      http://${ip}:${PORT}`);
  });
} else {
  console.log(`📱  Field LAN:      http://0.0.0.0:${PORT}`);
}
console.log(`⚡  Live WebSocket: ws://localhost:${PORT}/ws`);
console.log(`📂  Native SQLite:  /Volumes/MAC/Thai_Community/community_shield.sqlite`);
console.log(`🧊  3D GLB Model:   /Volumes/MAC/Thai_Community/thai_community_visible_low_areas.glb`);
console.log(`📶  PWA & Offline:  Active (sw.js + manifest.json enabled)`);
console.log(`=======================================================`);
