# Community Shield (ประชาอารักษ์) — ชุมชนวัดเทวราชกุญชร เขตดุสิต
## สถาปัตยกรรมระบบและการวางแผนพัฒนาด้วย Bun + React Native 100% (Universal Web & Mobile App)

---

### 1. บทสรุปภาพรวมโครงการ (Executive Summary & Project Context)

**Community Shield (ประชาอารักษ์)** คือระบบ **AI-Powered Community Disaster Resilience & Emergency Decision Support System** ที่ออกแบบมาเพื่อเปลี่ยนกระบวนการจัดการภัยพิบัติในระดับชุมชนเมือง จากระบบเตือนภัยแบบเดิมที่ทำได้เพียง *"แจ้งเตือนว่าน้ำกำลังมา"* ไปสู่ระบบสนับสนุนการตัดสินใจและการลงมือปฏิบัติการเชิงรุก (Proactive Decision & Action):

$$\text{Data} \longrightarrow \text{Meaning} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Feedback}$$

#### บริบทพื้นที่จริง: ชุมชนวัดเทวราชกุญชร เขตดุสิต กรุงเทพมหานคร
- **ทำเลที่ตั้ง**: ชุมชนริมแม่น้ำเจ้าพระยา ใกล้วัดเทวราชกุญชรวรวิหาร เขตดุสิต
- **ลักษณะทางกายภาพ**: เป็นชุมชนประวัติศาสตร์/ดั้งเดิม มีทางเดินตรอกซอกซอยแคบ (กว้าง 1.5 - 3.0 เมตร) บันได ระดับพื้นที่สูง-ต่ำต่างกัน และมีบ้านเรือนหลากหลายรูปแบบ (บ้านไม้ใต้ถุนสูง, บ้านปูน 2 ชั้น, บ้านพักอาศัยหนาแน่น)
- **ประวัติน้ำท่วมจริง**: ชุมชนอยู่นอกแนวคันกั้นน้ำถาวรของ กทม. ในช่วงน้ำทะเลหนุนสูงร่วมกับน้ำเหนือหลาก (เช่น เหตุการณ์จริงตุลาคม 2567) น้ำจะเอ่อท่วมซอย สำนักงานเขตต้องต่อสะพานไม้ชั่วคราวเป็นทางเดินยกระดับ
- **ข้อจำกัดทางยุทธวิธี**: รถพยาบาลกู้ชีพ (EMS) หรือรถดับเพลิงไม่สามารถขับเข้าตรอกซอกซอยได้โดยตรง และเรือก็ไม่สามารถแล่นเข้าตรอกที่น้ำตื้น 30-40 ซม. ได้ การช่วยเหลือจึงต้องพึ่งพา **"Community Relay"** (ทีมชุมชนใช้เปลแบกเดินผ่านสะพานไม้ยกสูงไปยังจุดส่งต่อการแพทย์ / Medical Point ที่รถ EMS จอดเทียบได้)

---

### 2. หลักการออกแบบสำคัญ (Core System Principles — จากเอกสารสรุป 60 ข้อ)

1. **AI ไม่ใช่ผู้สั่งการ (Human-in-the-Loop)**:
   - AI มีหน้าที่: รวบรวมข้อมูล $\rightarrow$ วิเคราะห์แนวโน้ม $\rightarrow$ อธิบายเหตุผล (AI Explainability) $\rightarrow$ เสนอ 3 แผนทางเลือก (Plan A / B / C)
   - เจ้าหน้าที่/ผู้บัญชาการเหตุการณ์ (Officer) เป็นผู้ตรวจสอบ ตัดสินใจ อนุมัติ หรือแก้ไขแผน
2. **AI Explainability (ต้องบอกได้ว่า "ทำไม")**:
   - ระบบไม่แสดงเพียง "Zone C สีแดง" แต่ระบุเหตุผล: *ระดับน้ำเพิ่ม +0.17m/30m + ฝนตกต่อเนื่อง + ภูมิประเทศแอ่งกระทะ + ท่อระบายน้ำคอขวด*
3. **ระบบสีสถานะคู่ (Dual Status Color System)**:
   - 🌊 **สีพื้นที่ = ระดับภัย (Area Hazard Level)**: 🟢 ปกติ (Normal) | 🟡 เฝ้าระวัง (Watch) | 🟠 เสี่ยงสูง (High Risk) | 🔴 วิกฤต (Critical)
   - 🏠 **สีบ้าน = สถานะการเข้าถึง/ช่วยเหลือ (Household Access/Rescue Status)**: 🟢 ปลอดภัย/เข้าถึงได้ | 🟡 ต้องติดตาม/ยังไม่ยืนยัน | 🟠 เข้าถึงยาก | 🔴 ต้องการความช่วยเหลือเร่งด่วน
4. **คนไม่มีมือถือ ไม่หลุดจากระบบ ("ไม่มีมือถือ ≠ เสี่ยงสูง" และ "ไม่มีมือถือ ≠ ไม่มีตัวตน")**:
   - บันทึกพิกัดบ้านกลุ่มเปราะบาง (ผู้สูงอายุ, ผู้ป่วยติดเตียง) ในฐานข้อมูลชุมชน
   - ส่ง Task ให้อาสาสมัคร/ผู้นำชุมชนเดินเท้าไปเคาะประตูบ้าน หรือใช้ "เสียงตามสาย"
5. **ช่วงเวลาเตรียมการ (Preparation Window)**:
   - คำนวณเวลาที่เหลือก่อนระดับน้ำถึงจุดวิกฤต (เช่น ⏱️ เหลือ 2 ชั่วโมง) พร้อมแบ่ง Checklist 4 ด้าน: คน (People), พื้นที่ (Area), ทรัพยากร (Resource), แผน (Plan)
6. **สถานการณ์วิกฤตจำลอง (Killer Demo Scenario — บ้าน A-012)**:
   - ผู้ป่วยติดเตียง ออกซิเจนสำรองเหลือ 90 นาที น้ำท่วมซอย 35 ซม. รถ EMS เข้าไม่ได้ $\rightarrow$ เสนอ Plan B: เปลสนามเดินเท้าไปยังจุด Medical Point B เชื่อมต่อรถพยาบาล
7. **Dynamic Replanning**:
   - เมื่อทีมภาคสนามส่ง Field Report ว่าถนนหรือสะพานไม้จุดใดชำรุด/จมน้ำ ระบบจะแจ้งเตือน ⚠️ "สถานการณ์เปลี่ยน" และคำนวณเส้นทางใหม่ทันที
8. **Offline-First & Communication Resilience**:
   - บันทึกข้อมูลและรับงานได้แม้ไม่มีสัญญาณอินเทอร์เน็ต เมื่อเชื่อมต่อสัญญาณจะซิงค์ข้อมูลอัตโนมัติ

---

### 3. สถาปัตยกรรมเทคโนโลยี 100% Bun + React Native

ระบบถูกออกแบบเป็น **Universal Cross-Platform Architecture** โดยใช้ **Bun** เป็น Runtime, Package Manager, API Server และ **React Native (Expo SDK / React Native Web)** เป็น Front-End Core สำหรับทั้ง **Web App (Command Center)** และ **Mobile App (Field & Citizen App)** จาก Codebase เดียวกัน:

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    BUN RUNTIME ENGINE                  │
                               │  - Bun Package Manager & Monorepo Workspaces           │
                               │  - High-Performance Bun.serve / Elysia REST & WS API   │
                               │  - Gemini AI Decision & Explainability Orchestrator    │
                               │  - LoRa Gateway & IoT Water Sensor Ingestion Hub       │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                   WebSocket (Real-time)   │   REST / SSE
                                                           │
         ┌─────────────────────────────────────────────────┴─────────────────────────────────────────────────┐
         │                                                                                                   │
         ▼                                                                                                   ▼
┌──────────────────────────────────────────┐                                       ┌──────────────────────────────────────────┐
│         WEB APP (Command Center)         │                                       │        MOBILE APP (Field / Citizen)      │
│     React Native Web + NativeWind        │                                       │        React Native (iOS / Android)      │
│  - Large Multi-pane GIS Situation Board  │                                       │  - Task Checklist & Dispatch Navigation  │
│  - 3D Interactive Simulation Viewport    │                                       │  - Camera Photo & Water Gauge Upload     │
│  - Water Level Graph (Actual vs Forecast)│                                       │  - Citizen SOS & Voice-to-Incident       │
│  - AI Recommendation & Decision Buttons  │                                       │  - Offline-first SQLite/MMKV Caching     │
└──────────────────────────────────────────┘                                       └──────────────────────────────────────────┘
```

#### เทคโนโลยีหลักที่เลือกใช้
| Layer | Technology | หน้าที่และความเหมาะสม |
| :--- | :--- | :--- |
| **Runtime & Tooling** | **Bun (v1.1+)** | Runtime เร็วสูงสุด, native TypeScript, บิลด์เร็ว และเป็น package manager หลัก 100% |
| **API & Realtime Backend** | **Bun.serve + Elysia.js / Hono** | ให้ Throughput สูงระดับไมโครวินาที รองรับ WebSocket สำหรับ Live Sensor & GPS Field Tracking |
| **AI Decision Engine** | **Google Gemini API (1.5/2.0 via Bun)** | วิเคราะห์แนวโน้ม, คำนวณ Rate of Rise, สร้างคำอธิบาย AI Explainability, แปลงเสียงเป็น Incident |
| **Frontend Framework** | **React Native (Universal via Expo 51+)** | เขียนครั้งเดียว รันได้ทั้ง Web (Command Center) และ Mobile (iOS, Android, PWA) |
| **Styling & Responsive UI**| **NativeWind v4 (Tailwind CSS)** | ปรับเปลี่ยน Layout อัตโนมัติตามขนาดหน้าจอ (Desktop Dashboard vs Mobile Bottom Sheet) |
| **3D Rendering** | **@react-three/fiber + expo-gl** | โหลดและเรนเดอร์โมเดล 3D ชุมชน `thai_community_visible_low_areas.glb` ได้ทั้งบน Web และ Mobile |
| **State Management** | **Zustand + TanStack Query** | จัดการ Client State, Scenario Timeline Slider, Sensor Feed, Real-time Incidents |
| **Offline Persistence** | **OP-SQLite / MMKV** | เก็บแคชแผนที่, Task, Field Report เพื่อให้ทีมปฏิบัติการทำงานได้แม้อินเทอร์เน็ตล่ม |

---

### 4. โครงสร้างโฟลเดอร์โครงการ (Monorepo Layout)

```
thai-community-shield/
├── package.json                         # Bun workspace root configuration
├── bun.lockb                            # Bun lockfile
│
├── apps/
│   ├── api/                             # Bun Backend Server
│   │   ├── src/
│   │   │   ├── index.ts                 # Bun.serve entrypoint (Elysia/Hono)
│   │   │   ├── routes/
│   │   │   │   ├── sensors.ts           # IoT Water Level & Rainfall API
│   │   │   │   ├── incidents.ts         # SOS, Voice Reports, Field Incidents
│   │   │   │   ├── tasks.ts             # Response Tasks (Accept, Inspect, Report)
│   │   │   │   ├── simulation.ts        # What-if scenario calculation
│   │   │   │   └── ai.ts                # Gemini API Decision & Explainability
│   │   │   ├── services/
│   │   │   │   ├── forecastEngine.ts    # Rate of rise & flood projection logic
│   │   │   │   ├── routingEngine.ts     # Community walkway graph & relay pathfinder
│   │   │   │   └── loraGateway.ts       # LoRa packet parser & mock sensor generator
│   │   │   └── data/
│   │   │       ├── communityData.json   # 16 houses, 2 clinics, coordinates, elderly data
│   │   │       └── historicalFloods.json# Historical flood records (Oct 2024, etc.)
│   │   └── package.json
│   │
│   └── app/                             # Universal React Native (Web + Mobile)
│       ├── app/                         # Expo Router structure
│       │   ├── _layout.tsx              # Root Layout & Provider Setup
│       │   ├── index.tsx                # Dynamic redirect (Web -> /command, Mobile -> /field)
│       │   ├── (command)/               # Web Command Center Dashboard
│       │   │   ├── _layout.tsx
│       │   │   ├── index.tsx            # Main Disaster Dashboard
│       │   │   ├── simulation.tsx       # 3D Interactive Timeline Simulation
│       │   │   ├── resources.tsx        # Shelter, EMS, Stretcher Allocation
│       │   │   └── analytics.tsx        # Historical vs Forecast Water Graphs
│       │   └── (mobile)/                # Field & Citizen Mobile App
│       │       ├── _layout.tsx
│       │       ├── tasks.tsx            # Response Task Checklist
│       │       ├── report.tsx           # Photo, GPS & Field Water Measurement
│       │       ├── sos.tsx              # Citizen SOS & Voice Incident Report
│       │       └── map.tsx              # Offline Evacuation Walkway Map
│       ├── components/
│       │   ├── 3d/                      # Three.js / React Three Fiber Viewport
│       │   │   ├── CommunityViewer.tsx  # GLTF Loader for thai_community_visible_low_areas.glb
│       │   │   ├── WaterMesh.tsx        # Dynamic procedural flood water level plane
│       │   │   ├── MarkerPin.tsx        # 3D Pin (House A-012, Medical Point B, Blocked Alleys)
│       │   │   └── CameraControls.tsx   # Presets: Isometric, Top-down, Street-level
│       │   ├── dashboard/
│       │   │   ├── WaterGraph.tsx       # Actual (Green) vs AI Forecast (Orange) Chart
│       │   │   ├── PrepWindowCard.tsx   # ⏱️ 2-Hour Preparation Checklist
│       │   │   ├── DecisionPanel.tsx    # Plan A/B/C cards with [Approve] button
│       │   │   └── HouseDetailModal.tsx # Dual Status details (Elderly, Oxygen status)
│       │   └── common/
│       │       ├── DualStatusBadge.tsx  # Area Risk vs House Access badges
│       │       └── TimelineSlider.tsx   # 20:00 -> 21:00 -> 22:00 scenario scrubber
│       ├── assets/
│       │   ├── glb/                     # thai_community_visible_low_areas.glb
│       │   └── textures/
│       └── package.json
│
└── packages/
    ├── shared/                          # Shared TypeScript Types & Business Logic
    │   ├── src/
    │   │   ├── types/                   # Incident, House, Sensor, Task, Plan types
    │   │   ├── constants/               # Thresholds (0.42m, 0.72m, 1.00m)
    │   │   └── utils/                   # Coordinate projection & risk calculations
    │   └── package.json
    └── ui/                              # Shared cross-platform UI primitives
        └── package.json
```

---

### 5. แผนการจัดสร้างฟีเจอร์หลัก (Feature Breakdown & Modules)

#### โมดูล 1: Live Sensor Ingestion & Dual Graph Engine
- **ฟังก์ชัน**: รับค่าระดับน้ำและฝนจาก Sensor / LoRa (หรือ Mock Data generator)
- **กราฟระดับน้ำไดนามิก**:
  - 🟢 **เส้นเขียว (Actual)**: 20:00 (0.42m) $\rightarrow$ 20:30 (0.55m) $\rightarrow$ 21:00 (0.72m)
  - 🟠 **เส้นส้ม (AI Forecast)**: 21:30 (0.84m) $\rightarrow$ 22:00 (1.00m เกินระดับวิกฤต)
  - คำนวณ Rate of Rise ($+0.17\text{ m}/30\text{ min}$)
- **Preparation Window**: แสดงเวลานับถอยหลัง (เช่น ⏱️ เหลือ 2 ชม.) เชื่อมโยง Checklist ตรวจกลุ่มเปราะบาง, ตรวจความพร้อมจุดพักพิง

#### โมดูล 2: 3D Community Simulation Viewport
- **ฟังก์ชัน**: เรนเดอร์ไฟล์โมเดล `thai_community_visible_low_areas.glb` ใน React Native
- **Dynamic Water Level Plane**: ผิวน้ำ 3D ค่อยๆ ยกตัวขึ้นตาม Timeline Slider (20:00 $\rightarrow$ 21:00 $\rightarrow$ 22:00)
  - 20:00: น้ำอยู่ในคลองและริมตลิ่ง
  - 21:00: น้ำเริ่มเอ่อท่วมซอยระดับต่ำหน้าบ้าน A-012 (35 ซม.)
  - 22:00: น้ำท่วมสะพานไม้บางช่วง ตัดเส้นทางหลัก
- **3D Interactive Pins**: คลิกที่ตัวบ้าน (16 หลัง) หรือสถานที่สำคัญ (ศูนย์สุขภาพ, ศูนย์ชุมชน) เพื่อดูสถานะ Dual Status

#### โมดูล 3: AI Explainability & 3-Plan Recommendation
- **ฟังก์ชัน**: เมื่อเกิด Incident บ้าน A-012 (ผู้ป่วยติดเตียง ออกซิเจนเหลือ 90 นาที)
- **AI คำนวณ 3 แผนเปรียบเทียบ**:
  - **Plan A (Direct EMS)**: รถพยาบาลตรงถึงบ้าน $\rightarrow$ *[เป็นไปไม่ได้: ซอยแคบและน้ำท่วม 35 ซม.]*
  - **Plan B (Community Relay - แนะนำ)**: ทีมอาสา 02 เดินเท้าแบกเปลบนสะพานไม้ $\rightarrow$ จุด Medical Point B $\rightarrow$ ส่งต่อรถ EMS
  - **Plan C (Early Evacuation)**: อพยพเข้า Shelter ชุมชน $\rightarrow$ *[ข้อจำกัด: Shelter A เหลือความจุเพียง 18 คน และไม่มีถังออกซิเจนสำรอง]*
- **Human-in-the-loop**: แสดงปุ่มให้ผู้บังคับการกด `[อนุมัติ Plan B]`, `[ปรับแต่ง]`, หรือ `[ปฏิเสธ]`

#### โมดูล 4: Field Responder Mobile Workflow & Dynamic Replanning
- **ฟังก์ชัน**: เมื่อ Plan B ได้รับอนุมัติ $\rightarrow$ สร้าง **Task #A-012** ไปยัง Mobile App ของ Community Team 02
- **Workflow**: `Accept` $\rightarrow$ `Navigate` $\rightarrow$ `Arrive` $\rightarrow$ `Inspect & Report` $\rightarrow$ `Close`
- **Field Report**: อัปโหลดภาพถ่าย, พิกัด GPS, วัดระดับน้ำจริง
- **Dynamic Replanning Trigger**: หากทีมรายงานว่า *"สะพานไม้จุดแยก 2 ชำรุด/จมน้ำ"* $\rightarrow$ ระบบแจ้งเตือน ⚠️ "สถานการณ์เปลี่ยน" และคำนวณเส้นทางเลี่ยงให้อัตโนมัติ

#### โมดูล 5: Community Voice & Non-Digital Citizens Inclusion
- **ฟังก์ชัน**: ประชาชนส่งข้อความเสียงหรือโทรแจ้งเหตุ $\rightarrow$ AI ถอดความและสกัดเป็น Structured Incident (ประเภทเหตุ, พิกัด, ความเร่งด่วน)
- **การจัดการคนไม่มีมือถือ**: มีบัญชีบ้านกลุ่มเปราะบางที่ไม่ใช้ออนไลน์ แสดงสถานะ 🟡 "ยังไม่ยืนยัน" พร้อมระบบออกใบงานให้ อสม./ผู้นำชุมชนเดินตรวจ หรือจัดคิวประกาศผ่านเสียงตามสาย

---

### 6. แผนการดำเนินงานและขั้นตอนพัฒนา (Phase-by-Phase Execution Plan)

| Phase | หัวข้อ | รายละเอียดงาน | ผลลัพธ์ที่ได้ (Deliverables) |
| :---: | :--- | :--- | :--- |
| **1** | **Project Setup & Monorepo** | ติดตั้ง Bun, จัดทำ Workspace monorepo (`apps/api`, `apps/app`, `packages/shared`), ตั้งค่า TypeScript, NativeWind | โครงสร้างโปรเจกต์พร้อมคำสั่ง `bun run dev` ที่รันทั้ง API และ App |
| **2** | **3D Asset Pipeline & Viewer** | นำเข้า `thai_community_visible_low_areas.glb`, สร้าง `@react-three/fiber` component, วางระดับผิวน้ำไดนามิก, เพิ่ม Camera Presets | คอมโพเนนต์ 3D ชุมชนที่หมุน ซูม และเลื่อนระดับน้ำตาม Slider ได้ |
| **3** | **Data Models & Bun API Backend** | สร้าง Mock IoT Sensor Generator, JSON ฐานข้อมูล 16 หลังคาเรือน + กลุ่มเปราะบาง, สร้าง REST & WebSocket endpoints | Backend บน Bun ที่สตรีมระดับน้ำ, ฝน, และสถานะบ้านแบบ Real-time |
| **4** | **Command Center WebApp** | พัฒนาหน้า Dashboard, Dual Graph (เขียว/ส้ม), Preparation Window Card, ผังควบคุม 3 แผนช่วยเหลือ (A/B/C) | WebApp สำหรับศูนย์ปฏิบัติการที่มีความครบถ้วนตามเอกสารสรุป 60 ข้อ |
| **5** | **Mobile Field & Incident App** | ทำหน้ารายการ Task ของทีมกู้ภัย, แบบฟอร์มรายงาน Field Report, หน้ารับแจ้งเหตุ SOS ของชุมชน, การแคชข้อมูลออฟไลน์ | Mobile App ที่สามารถกดรับงาน, อัปเดตสถานะ, และส่งข้อมูลกลับศูนย์ |
| **6** | **AI Integration & Decision Engine** | เชื่อมต่อ Gemini API สำหรับ AI Explainability, สรุปผลกระทบ, วิเคราะห์เสียงร้องเรียน, และแจ้งเตือน Dynamic Replanning | ระบบ AI วิเคราะห์สถานการณ์จริงที่อธิบายเหตุผลและแนะนำแผนได้ |
| **7** | **Killer Demo Script Verification** | ทดสอบรัน Timeline Scenario ตั้งแต่ 20:00 ถึง 20:32 น. ตามเคสบ้าน A-012 ให้ทำงานต่อเนื่องอย่างราบรื่น | Demo ที่สมบูรณ์แบบพร้อมนำเสนอต่อคณะกรรมการหรือหน่วยงาน |

---

### 7. แผนการตรวจสอบและทดสอบระบบ (Verification & Demo Checklist)

- [ ] **3D Rendering Check**: โมเดลชุมชน 16 หลัง + อาคารสาธารณะ 2 หลัง เรนเดอร์ถูกต้อง ผิวน้ำยกตัวตาม slider
- [ ] **Dual Graph Accuracy**: แสดงข้อมูลย้อนหลัง (เขียว) ชัดเจน และพยากรณ์ล่วงหน้า (ส้ม) ต่อเนื่องถึง 1.00m
- [ ] **Preparation Window Trigger**: แสดง Checklist 4 ด้าน ทันทีที่การพยากรณ์แตะเส้น Threshold
- [ ] **Dual Status Verification**: แยกสีโซนความเสี่ยง (น้ำท่วม) กับสีตัวบ้าน (การช่วยเหลือ) ไม่สับสน
- [ ] **Non-digital Citizen Logic**: แสดงบ้าน A-012 (ไม่มีมือถือ/ผู้ป่วยติดเตียง) และออก Task ให้อาสาสมัครไปตรวจสอบได้
- [ ] **AI Recommendation & Explainability**: แสดงข้อความอธิบายเหตุผลว่าทำไมถึงแนะนำ Plan B แทนที่จะเป็น Plan A หรือ C
- [ ] **Dynamic Replanning Loop**: เมื่อเปลี่ยนสถานะถนนเป็น "ผ่านไม่ได้" ระบบต้องแสดงสัญญาณเตือนและปรับเส้นทางทันที
- [ ] **Universal Responsiveness**: หน้าจอ Command Center แสดงผลได้สมบูรณ์บนเดสก์ท็อป และหน้าจอ Field App ทำงานลื่นไหลบนมือถือ
