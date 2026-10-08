/**
 * High-Performance Bun Backend Server for Community Shield (ประชาอารักษ์)
 * Wat Thewarat Kunchorn Community Disaster Resilience System
 */

import {
  COMMUNITY_INFO,
  INITIAL_SENSOR_READINGS,
  INITIAL_HOUSEHOLDS,
  INITIAL_PREPARATION_CHECKLIST,
  HOUSE_A012_RESCUE_PLANS,
  SIMULATION_TIMELINE_STEPS,
  generateAiExplanation,
} from '@community-shield/shared';
import type {
  Household,
  Incident,
  ResponseTask,
  PreparationChecklistItem,
  FieldReport,
} from '@community-shield/shared';

// In-Memory State for the Live Prototype
let currentStepIndex = 0;
let households: Household[] = JSON.parse(JSON.stringify(INITIAL_HOUSEHOLDS));
let checklist: PreparationChecklistItem[] = JSON.parse(JSON.stringify(INITIAL_PREPARATION_CHECKLIST));

let incidents: Incident[] = [
  {
    id: 'inc-001',
    code: 'INC-2024-001',
    category: 'medical_critical',
    severity: 'critical',
    status: 'open',
    reportedAt: '20:20',
    locationName: 'บ้าน A-012 (หลังตลาดเก่า ริมคลอง)',
    targetHouseholdId: 'house-012',
    descriptionTh:
      'ผู้ป่วยติดเตียง (นางสมจิตร อายุ 82 ปี) ใช้เครื่องผลิตออกซิเจน ถังสำรองเหลือประมาณ 90 นาที น้ำหน้าบ้านท่วมขัง 35 ซม. รถพยาบาลเข้าซอยไม่ได้',
    aiExplanationTh:
      'ความเสี่ยงระดับวิกฤต: พื้นที่ลุ่มต่ำ Zone C น้ำเอ่อท่วมซอย 35 ซม. + ผู้ป่วยติดเตียงออกซิเจนจำกัด 90 นาที + ตรอกแคบรถพยาบาลเข้าไม่ได้',
    currentWaterDepthCm: 35,
    recommendedPlanId: 'PLAN_B',
  },
];

let tasks: ResponseTask[] = [];

// Active WebSocket connections for real-time broadcasts
const clients = new Set<any>();

function broadcast(eventType: string, payload: any) {
  const message = JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() });
  for (const client of clients) {
    try {
      client.send(message);
    } catch {
      clients.delete(client);
    }
  }
}

const PORT = Number(process.env.PORT || 3001);

const server = (Bun as any).serve({
  port: PORT,
  fetch(req: Request, serverRef: any) {
    const url = new URL(req.url);

    // 1. Upgrade WebSocket connections
    if (url.pathname === '/ws') {
      const upgraded = serverRef.upgrade(req);
      if (upgraded) return undefined;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // 2. CORS Preflight & Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Router Helper
    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data, null, 2), { status, headers: corsHeaders });

    try {
      // Health Check
      if (url.pathname === '/api/health') {
        return json({
          status: 'ok',
          service: 'Community Shield Bun API',
          community: COMMUNITY_INFO.nameTh,
          activeClients: clients.size,
          currentSimTime: SIMULATION_TIMELINE_STEPS[currentStepIndex].timeLabel,
        });
      }

      // Simulation Timeline Endpoints
      if (url.pathname === '/api/simulation/timeline') {
        return json({
          steps: SIMULATION_TIMELINE_STEPS,
          currentIndex: currentStepIndex,
          currentStep: SIMULATION_TIMELINE_STEPS[currentStepIndex],
        });
      }

      if (url.pathname === '/api/simulation/current') {
        return json(SIMULATION_TIMELINE_STEPS[currentStepIndex]);
      }

      if (url.pathname === '/api/simulation/step' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const newIndex = typeof body.stepIndex === 'number' ? body.stepIndex : currentStepIndex + 1;
          if (newIndex >= 0 && newIndex < SIMULATION_TIMELINE_STEPS.length) {
            currentStepIndex = newIndex;
            const activeStep = SIMULATION_TIMELINE_STEPS[currentStepIndex];

            // If step is 20:20 or later, update house A-012 status
            if (activeStep.timeLabel >= '20:20') {
              const h12 = households.find((h) => h.id === 'house-012');
              if (h12) h12.accessStatus = 'critical_help_needed';
            }

            broadcast('SIMULATION_STEP_CHANGED', {
              stepIndex: currentStepIndex,
              step: activeStep,
            });

            return json({ success: true, currentIndex: currentStepIndex, currentStep: activeStep });
          }
          return json({ error: 'Invalid step index' }, 400);
        })();
      }

      // Sensor Readings (Actual vs Forecast)
      if (url.pathname === '/api/sensors') {
        return json({
          latestWaterLevel: SIMULATION_TIMELINE_STEPS[currentStepIndex].waterLevelMeters,
          series: INITIAL_SENSOR_READINGS,
          activeThresholdMeters: 1.0,
        });
      }

      // Preparation Window
      if (url.pathname === '/api/preparation-window') {
        return json({
          currentSimTime: SIMULATION_TIMELINE_STEPS[currentStepIndex].timeLabel,
          targetTime: '22:00',
          remainingMinutes: Math.max(0, 120 - currentStepIndex * 15),
          criticalThresholdMeters: 1.0,
          checklists: checklist,
        });
      }

      if (url.pathname.startsWith('/api/preparation-window/toggle/') && req.method === 'POST') {
        const itemId = url.pathname.replace('/api/preparation-window/toggle/', '');
        const item = checklist.find((c) => c.id === itemId);
        if (item) {
          item.completed = !item.completed;
          broadcast('PREPARATION_CHECKLIST_UPDATED', checklist);
          return json({ success: true, item });
        }
        return json({ error: 'Item not found' }, 404);
      }

      // Households Registry (16 Houses)
      if (url.pathname === '/api/households') {
        return json({
          count: households.length,
          households,
        });
      }

      if (url.pathname.startsWith('/api/households/')) {
        const id = url.pathname.replace('/api/households/', '');
        const house = households.find((h) => h.id === id || h.code === id);
        if (house) {
          const explanation = generateAiExplanation(
            house,
            INITIAL_SENSOR_READINGS[2],
            SIMULATION_TIMELINE_STEPS[currentStepIndex].blockedRoadNames.length > 0
          );
          return json({ household: house, aiExplanation: explanation });
        }
        return json({ error: 'Household not found' }, 404);
      }

      // Incidents Center
      if (url.pathname === '/api/incidents') {
        return json({ incidents });
      }

      // Citizen Voice/Text SOS Report Endpoint (AI structuring)
      if (url.pathname === '/api/incidents/voice-report' && req.method === 'POST') {
        return (async () => {
          const body = await req.json().catch(() => ({}));
          const rawText = body.text || 'น้ำเริ่มเอ่อท่วมซอยหลังวัด ระบายไม่ทัน';

          // Simulate AI Natural Language Structuring
          const newIncident: Incident = {
            id: `inc-${Date.now()}`,
            code: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
            category: rawText.includes('ป่วย') ? 'medical_critical' : 'drainage_bottleneck',
            severity: rawText.includes('ป่วย') ? 'critical' : 'high',
            status: 'open',
            reportedAt: SIMULATION_TIMELINE_STEPS[currentStepIndex].timeLabel,
            locationName: body.location || 'ชุมชนวัดเทวราชกุญชร',
            descriptionTh: rawText,
            aiExplanationTh: `AI สกัดข้อมูลจากเสียงร้องเรียน: ตรวจพบปัญหา ${rawText.includes('ป่วย') ? 'ทางการแพทย์' : 'การระบายน้ำ'} ต้องการการตรวจสอบพื้นที่`,
            currentWaterDepthCm: 25,
          };

          incidents.unshift(newIncident);
          broadcast('NEW_INCIDENT_REPORTED', newIncident);
          return json({ success: true, incident: newIncident });
        })();
      }

      // AI Rescue Plans (House A-012)
      if (url.pathname === '/api/plans/house-a012') {
        return json({
          householdCode: 'A-012',
          plans: HOUSE_A012_RESCUE_PLANS,
        });
      }

      // Human-in-the-Loop Officer Approval
      if (url.pathname.startsWith('/api/plans/') && url.pathname.endsWith('/approve') && req.method === 'POST') {
        const planId = url.pathname.split('/')[3];
        const selectedPlan = HOUSE_A012_RESCUE_PLANS.find((p) => p.id === planId);

        if (!selectedPlan) {
          return json({ error: 'Plan not found' }, 404);
        }

        // Update Incident
        const inc = incidents.find((i) => i.targetHouseholdId === 'house-012');
        if (inc) {
          inc.status = 'plan_approved';
          inc.approvedPlanId = planId;
        }

        // Generate Response Task
        const newTask: ResponseTask = {
          id: 'task-a012',
          code: 'TASK #A-012',
          incidentId: inc?.id || 'inc-001',
          priority: 'critical',
          titleTh: 'เคลื่อนย้ายผู้ป่วยติดเตียงบ้าน A-012 (ยายสมจิตร)',
          missionObjectiveTh:
            'ใช้เปลสนามเดินเท้าบนสะพานไม้ยกสูง นำผู้ป่วยและถังออกซิเจนสำรองมายังจุดส่งต่อการแพทย์ Medical Point B',
          targetHouseholdId: 'house-012',
          assignedTeam: 'Community Team 02',
          destinationPoint: 'จุดส่งต่อการแพทย์ B (หน้าวัดเทวราชกุญชร)',
          status: 'accepted',
          createdAt: '20:23',
          acceptedAt: '20:24',
        };

        tasks = [newTask, ...tasks.filter((t) => t.id !== newTask.id)];
        if (inc) inc.assignedTaskId = newTask.id;

        broadcast('PLAN_APPROVED_AND_TASK_DISPATCHED', {
          plan: selectedPlan,
          task: newTask,
        });

        return json({
          success: true,
          message: 'อนุมัติแผนสำเร็จและออกใบงานมอบหมายทีม Community Team 02 เรียบร้อยแล้ว',
          approvedPlan: selectedPlan,
          task: newTask,
        });
      }

      // Dispatch Tasks Lifecycle
      if (url.pathname === '/api/tasks') {
        return json({ tasks });
      }

      if (url.pathname.startsWith('/api/tasks/') && url.pathname.endsWith('/status') && req.method === 'POST') {
        return (async () => {
          const taskId = url.pathname.split('/')[3];
          const body = await req.json().catch(() => ({}));
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            task.status = body.status;
            if (body.status === 'arrived') task.arrivedAt = '20:30';
            if (body.status === 'closed') task.completedAt = '20:35';

            broadcast('TASK_STATUS_CHANGED', task);
            return json({ success: true, task });
          }
          return json({ error: 'Task not found' }, 404);
        })();
      }

      // Field Report Submission with Dynamic Replanning Trigger
      if (url.pathname.startsWith('/api/tasks/') && url.pathname.endsWith('/report') && req.method === 'POST') {
        return (async () => {
          const taskId = url.pathname.split('/')[3];
          const body = await req.json().catch(() => ({}));
          const task = tasks.find((t) => t.id === taskId);

          if (!task) return json({ error: 'Task not found' }, 404);

          const fieldReport: FieldReport = {
            id: `rep-${Date.now()}`,
            taskId,
            submittedAt: '20:30',
            teamCode: task.assignedTeam,
            actualWaterDepthCm: body.actualWaterDepthCm || 45,
            alleyPassableOnFoot: true,
            boardwalkStructureSafe: body.boardwalkStructureSafe ?? false, // Bridge submerged!
            patientConditionSummaryTh: 'ผู้ป่วยมีสัญญาณชีพคงที่ ออกซิเจนยังเพียงพอ 70 นาที',
            gpsCoordinates: { lat: 13.7712, lng: 100.5015 },
            triggersReplanning: true,
            replanningReasonTh: 'สะพานไม้ทางแยกหลักจมน้ำลึก 45 ซม. แนะนำใช้อ้อมระเบียงศูนย์ชุมชน',
          };

          task.fieldReport = fieldReport;
          task.status = 'reported';

          // Trigger Dynamic Replanning Notification!
          broadcast('DYNAMIC_REPLANNING_ALERT', {
            taskId,
            alertMessageTh:
              '⚠️ สถานการณ์เปลี่ยน: สะพานไม้ทางแยกหลักจมน้ำ ระบบคำนวณเส้นทางเลี่ยงใหม่ผ่านหน้าศูนย์ชุมชนเรียบร้อยแล้ว',
            fieldReport,
          });

          return json({ success: true, fieldReport, replanningTriggered: true });
        })();
      }

      return json({ error: 'Endpoint not found' }, 404);
    } catch (err: any) {
      console.error('API Error:', err);
      return json({ error: err?.message || 'Internal server error' }, 500);
    }
  },
  websocket: {
    open(ws: any) {
      clients.add(ws);
      ws.send(JSON.stringify({ event: 'CONNECTED', message: 'Connected to Community Shield Live Bus' }));
    },
    message(ws: any, message: string) {
      // Echo or client message handler
    },
    close(ws: any) {
      clients.delete(ws);
    },
  },
});

console.log(`[Community Shield] Bun API Server running at http://localhost:${PORT}`);
