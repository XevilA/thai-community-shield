# Community Shield (ระบบประชาอารักษ์)
### AI-Powered Community Disaster Resilience & Emergency Decision Support System
**กรณีศึกษาเชิงพื้นที่: ชุมชนวัดเทวราชกุญชร แขวงวชิรพยาบาล เขตดุสิต กรุงเทพมหานคร**

---

## 1. บทนำและขอบเขตโครงการ (Project Overview)

**Community Shield (ระบบประชาอารักษ์)** คือระบบสารสนเทศเพื่อการบริหารจัดการภาวะฉุกเฉินและสนับสนุนการตัดสินใจเชิงกลยุทธ์ในระดับชุมชนเมือง (Urban Community Disaster Resilience & Emergency Decision Support System) ถูกออกแบบขึ้นเพื่อแก้ปัญหาคอขวดของระบบเตือนภัยแบบดั้งเดิมที่จำกัดอยู่เพียงการแจ้งเตือนระดับน้ำ โดยยกระดับสู่กระบวนการตัดสินใจเชิงปฏิบัติการที่มีข้อมูลเชิงประจักษ์รองรับอย่างเป็นระบบ ตามวงจรปฏิบัติการ:

$$\text{Data (ข้อมูลสภาพแวดล้อม)} \longrightarrow \text{Meaning (การวิเคราะห์ผลกระทบ)} \longrightarrow \text{Decision (ข้อเสนอแนะเชิงกลยุทธ์)} \longrightarrow \text{Action (การปฏิบัติการภาคสนาม)} \longrightarrow \text{Feedback (การปรับปรุงข้อมูลย้อนกลับ)}$$

ระบบได้รับการพัฒนาภายใต้สถาปัตยกรรม Universal Monorepo โดยใช้ภาษา TypeScript ร่วมกับ Bun Runtime ครอบคลุมทั้งระบบบริหารสถานการณ์สำหรับศูนย์บัญชาการเหตุการณ์ (Command Center Web Application) และระบบสนับสนุนการทำงานสำหรับทีมกู้ภัยภาคสนามและประชาชน (Field Responder & Citizen Web/Mobile Application) จากฐานรหัสต้นฉบับเดียวกัน

---

## 2. ข้อมูลเชิงพื้นที่: ชุมชนวัดเทวราชกุญชร (Geographical Context)

ชุมชนวัดเทวราชกุญชร เขตดุสิต กรุงเทพมหานคร เป็นชุมชนริมแม่น้ำเจ้าพระยาที่มีลักษณะทางกายภาพเฉพาะตัวและมีความเปราะบางต่อระดับน้ำขึ้น-น้ำลง และน้ำหลาก:
- **ขอบเขตพื้นที่จำลอง**: ประมาณ 200 x 190 เมตร ครอบคลุมบ้านเรือน 16 หลังคาเรือน (รหัสสำรวจ A-001 ถึง A-016) และอาคารสาธารณะ 2 แห่ง
- **ข้อจำกัดทางกายภาพ**: ตรอกซอกซอยภายในชุมชนมีความคับแคบ ยานพาหนะขนาดใหญ่หรือรถพยาบาลฉุกเฉินไม่สามารถสัญจรเข้าถึงได้โดยตรง การเดินทางภายในต้องพึ่งพาสะพานไม้ยกสูงเป็นเส้นทางหลัก
- **ประชากรกลุ่มเปราะบาง**: มีสัดส่วนผู้สูงอายุและผู้ป่วยติดเตียงที่จำเป็นต้องได้รับการอพยพตามลำดับความสำคัญ เช่น กรณีบ้าน A-012 (ผู้ป่วยติดเตียงที่ต้องการออกซิเจนบำบัดต่อเนื่อง)
- **หลักการออกแบบการคุ้มครองสิทธิ**: การไม่มีอุปกรณ์สื่อสารเคลื่อนที่ไม่ถูกนำมาเป็นเงื่อนไขในการลดระดับความสำคัญ โดยยึดหลักเกณฑ์ "ไม่มีโทรศัพท์เคลื่อนที่ ไม่เท่ากับ มีความเสี่ยงสูง" และ "ไม่มีโทรศัพท์เคลื่อนที่ ไม่เท่ากับ ไม่มีตัวตนในระบบฐานข้อมูล"

---

## 3. สถาปัตยกรรมและขีดความสามารถหลัก (Core Capabilities)

### 3.1 การจำลองสถานการณ์ 3 มิติเชิงปฏิสัมพันธ์ (3D Environmental Simulation)
- พัฒนาด้วย Three.js และ WebGL จำลองสภาพแวดล้อม ภูมิประเทศ สิ่งปลูกสร้าง และผิวน้ำที่ตอบสนองต่อระดับน้ำทางอุทกวิทยาแบบเรียลไทม์
- ระบบจำลองการท่วมถึงของน้ำตามระดับความสูงของพื้นที่ (Elevation Mapping) และแสดงผลการตัดขาดของเส้นทางสัญจร (สะพานไม้และทางเดินเท้า)
- รองรับการจำลองสถานการณ์ภัยพิบัติหลากหลายรูปแบบ (Multi-hazard Scenarios): อุทกภัย (Riverine Flood), ดินถล่ม (Landslide), อัคคีภัย (Fire Incident), แผ่นดินไหว (Earthquake), และคลื่นสึนามิ (Tsunami)

### 3.2 ระบบพยากรณ์และหน้าต่างเวลาเตรียมการ (Dual-Line Forecasting & Preparation Window)
- **การวิเคราะห์ข้อมูลน้ำแบบเส้นคู่ (Dual-Line Hydrological Tracking)**:
  - ระดับน้ำจริงที่ตรวจวัดได้จากโครงข่ายเซนเซอร์ (Actual Water Level)
  - เส้นพยากรณ์ล่วงหน้า (AI Trend & Rainfall Forecast) คำนวณจากอัตราการเปลี่ยนแปลงระดับน้ำและปริมาณน้ำฝนสะสม
- **หน้าต่างเวลาในการปฏิบัติการ (Operational Preparation Window)**:
  - แปลงข้อมูลแนวโน้มทางอุทกวิทยาเป็นระยะเวลานับถอยหลังก่อนถึงเกณฑ์วิกฤต (Critical Threshold 1.00 เมตร)
  - รายการตรวจสอบความพร้อม 4 มิติ (Readiness Verification Matrix):
    - ด้านบุคคล (People): ตรวจสอบสถานะกลุ่มเปราะบางและผู้ป่วยติดเตียง
    - ด้านกายภาพ (Area): ตรวจสอบจุดระบายน้ำและระดับความสูงของสะพานทางเดิน
    - ด้านทรัพยากร (Resource): จัดเตรียมกำลังพล ทีมกู้ภัยชุมชน และจุดนัดพบรถพยาบาลฉุกเฉิน (EMS Rendezvous Point)
    - ด้านแผนการรองรับ (Plan): บริหารจัดการความจุศูนย์พักพิงชั่วคราวและการประสานส่งต่อโรงพยาบาลวชิรพยาบาล

### 3.3 ระบบสนับสนุนการตัดสินใจและการปรับแผนแบบพลวัต (DSS & Dynamic Replanning)
- ประเมินและเปรียบเทียบแผนปฏิบัติการฉุกเฉิน 3 รูปแบบ (Plan A / B / C) ตามข้อจำกัดทางกายภาพและระดับความเสี่ยง
- สถาปัตยกรรมแบบ Human-in-the-Loop โดยระบบทำหน้าที่เสนอแนะทางเลือกพร้อมดัชนีความน่าเชื่อถือ และต้องได้รับการอนุมัติจากผู้บัญชาการเหตุการณ์ก่อนออกคำสั่งการ
- การปรับแผนปฏิบัติการแบบพลวัต (Dynamic Replanning): เมื่อเจ้าหน้าที่ภาคสนามรายงานอุปสรรคที่ไม่คาดคิด (เช่น ทางเดินถูกน้ำท่วมตัดขาด) ระบบจะทำการคำนวณเส้นทางสำรองและปรับใบงานใหม่ทันทีโดยอัตโนมัติ

---

## 4. โครงสร้างสถาปัตยกรรมซอฟต์แวร์ (System Architecture)

```
Thai_Community/
├── apps/
│   ├── api/                             # Backend Service (Bun.serve & WebSocket Bus)
│   │   ├── src/index.ts                 # REST API, WebSocket Engine, SQLite Database
│   │   └── package.json
│   └── app/                             # Universal Client Application (React Native Web / PWA)
│       ├── src/
│       │   ├── App.tsx                  # Root Application Component
│       │   ├── components/              # Modular UI & Simulation Components
│       │   │   ├── Community3DViewer.tsx# Three.js 3D Viewport & Simulation Engine
│       │   │   ├── WaterLevelChart.tsx  # Dual-Line Hydrological Forecast Chart
│       │   │   ├── PreparationWindowCard.tsx # Operational Preparation Countdown & Checklist
│       │   │   ├── HouseholdsBoard.tsx  # Dual-Status Household Monitoring Board
│       │   │   ├── DecisionPanel.tsx    # Multi-Plan Evaluation & Commander Authorization
│       │   │   ├── MobileFieldTaskView.tsx # Mobile Interface for Responders
│       │   │   ├── FieldReportModal.tsx # Incident Reporting Modal
│       │   │   ├── CitizenSosModal.tsx  # Citizen Emergency SOS Interface
│       │   │   └── ReplanningBanner.tsx # Dynamic Replanning Notification Bar
│       │   └── index.tsx                # Client Entrypoint
│       └── package.json
├── packages/
│   └── shared/                          # Universal Shared Domain & Business Logic
│       ├── src/
│       │   ├── types/index.ts           # Unified TypeScript Interfaces & Types
│       │   ├── constants/index.ts       # Community Baseline, Household Profiles, Plans
│       │   └── utils/index.ts           # Hydrological Algorithms & Risk Assessment Logic
│       └── package.json
├── public/                              # Production Assets, 3D GLB Models, PWA Manifest
│   ├── model.glb                        # Community 3D Model Asset (Meshopt Optimized)
│   ├── manifest.json                    # Progressive Web App Manifest
│   └── sw.js                            # Offline Service Worker Caching Layer
├── server/                              # High-Performance Production Server Engine
├── deploy_to_vercel.py                  # Automated Cloud Deployment Engine via REST API
├── package.json                         # Monorepo Workspace Configuration
└── tsconfig.json                        # Monorepo TypeScript Compiler Configuration
```

---

## 5. เทคโนโลยีหลักที่ใช้ (Technology Stack)

| องค์ประกอบ | เทคโนโลยีที่เลือกใช้ | รายละเอียดทางเทคนิค |
| :--- | :--- | :--- |
| **Runtime & Toolchain** | Bun (v1.1+) | High-performance JavaScript/TypeScript Runtime, Bundler, and Package Manager |
| **Frontend Framework** | React Native (Web / Universal) | สถาปัตยกรรมร่วม รองรับการทำงานทั้งบนเว็บเบราว์เซอร์และอุปกรณ์พกพา |
| **3D Rendering Engine** | Three.js / WebGL | การเรนเดอร์แบบจำลองสิ่งแวดล้อม 3 มิติ และผิวน้ำทางอุทกวิทยา |
| **Local Database** | SQLite (WAL Mode) | จัดเก็บสถานะครัวเรือน บันทึกการปฏิบัติงาน และข้อมูลเซนเซอร์ในระดับโลคอล |
| **Offline Architecture** | Service Worker API & Cache Storage | รองรับการทำงานในภาวะสัญญาณอินเทอร์เน็ตขัดข้อง (PWA Offline First) |
| **Styling & Design System** | Tailwind CSS / CSS3 / iOS Human Interface Guidelines | รองรับ Responsive Layout เต็มรูปแบบทั้ง Desktop และ Mobile Viewport |

---

## 6. ข้อกำหนดการติดตั้งและการเรียกใช้งาน (Installation & Execution)

### 6.1 ความต้องการพื้นฐานของระบบ (Prerequisites)
- [Bun Runtime](https://bun.sh) เวอร์ชัน 1.1.0 ขึ้นไป
- เว็บเบราว์เซอร์ที่รองรับเทคโนโลยี WebGL 2.0 (เช่น Google Chrome, Safari, Microsoft Edge, Firefox)

### 6.2 การติดตั้งแพ็กเกจ (Dependencies Installation)
```bash
bun install
```

### 6.3 การรันระบบในสภาพแวดล้อมการพัฒนา (Development Mode)
```bash
# รัน Bun Backend API & WebSocket Server
bun run dev:api

# รัน Universal Web & Mobile Client Application
bun run dev:app
```

### 6.4 สคริปต์ควบคุมการทำงานของระบบ (Service Control Scripts)
ระบบมาพร้อมกับเชลล์สคริปต์สำหรับการบริหารจัดการการทำงานในระดับเบื้องหลัง:
```bash
# เริ่มการทำงานของระบบในโหมดเบื้องหลัง (Background Daemon)
./start.sh

# ตรวจสอบสถานะการทำงาน หน่วยความจำ และทราฟฟิกเครือข่าย
./status.sh

# สั่งหยุดการทำงานของระบบอย่างปลอดภัย (Graceful Shutdown)
./stop.sh
```

---

## 7. จุดเชื่อมต่อระบบและสเปกเครือข่าย (Network Endpoints)

| บริการ | โปรโตคอล / URL | วัตถุประสงค์ |
| :--- | :--- | :--- |
| **ศูนย์บัญชาการท้องถิ่น (Local Command Center)** | `http://localhost:3000` | หน้าควบคุมหลักสำหรับศูนย์บัญชาการและมอนิเตอร์สถานการณ์ |
| **เครือข่ายเฉพาะที่สำหรับทีมกู้ภัย (LAN/Hotspot)** | `http://<HOST_IP>:3000` | จุดเชื่อมต่อสำหรับเจ้าหน้าที่กู้ภัยผ่านสมาร์ตโฟนในสนาม |
| **ระบบส่งผ่านข้อมูลแบบเรียลไทม์ (Live WebSocket)** | `ws://localhost:3000/ws` | ส่งสัญญาณปรับปรุงระดับน้ำ สถานะงาน และตำแหน่งบุคลากร |
| **ระบบตรวจสอบสถานะระบบ (Health Check)** | `http://localhost:3000/api/health` | การตรวจสอบสถานะความพร้อมของเซอร์วิสและฐานข้อมูล |
| **ศูนย์บริการบนคลาวด์ (Production Cloud Endpoint)** | `https://thai-community-shield.vercel.app` | การเข้าถึงระบบผ่านเครือข่ายสาธารณะผ่าน Vercel Production |

---

## 8. การทดสอบและการรับรองความเข้ากันได้ (Verification & Compatibility)

- **การทดสอบความพร้อมใช้งานออฟไลน์ (Offline-First Verification)**: ตรวจสอบการทำงานของ Service Worker ในการแคชโมเดล 3D (`model.glb`) และ Asset ที่จำเป็นทั้งหมด เพื่อให้ระบบสามารถจำลองสถานการณ์ได้ต่อเนื่องแม้โครงข่ายอินเทอร์เน็ตหลักถูกตัดขาด
- **การทดสอบการตอบสนองต่อขนาดหน้าจอ (Responsive Viewport Testing)**: ผ่านการทดสอบอย่างสมบูรณ์ทั้งบน Desktop (1920x1080), Tablet, และ Mobile Viewport (390x844 iPhone Standard) โดยองค์ประกอบ UI จะปรับเปลี่ยนเป็น Mobile Bottom Sheet ตามมาตรฐาน iOS HIG โดยอัตโนมัติ

---

## 9. ข้อมูลลิขสิทธิ์และการเผยแพร่ (License & Governance)

โครงการนี้จัดทำขึ้นเพื่อการศึกษา วิจัย และพัฒนาความพร้อมในการรับมือภัยพิบัติของชุมชนเมือง ภายใต้สิทธิ์แบบเปิด (Open Source Software)
- Repository: [https://github.com/XevilA/thai-community-shield](https://github.com/XevilA/thai-community-shield)
- บัญชีผู้พัฒนา: [@XevilA](https://github.com/XevilA)
