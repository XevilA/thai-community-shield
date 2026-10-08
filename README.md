# Community Shield (ประชาอารักษ์)
### AI-Powered Community Disaster Resilience & Emergency Decision Support
**กรณีศึกษา: ชุมชนวัดเทวราชกุญชร เขตดุสิต ริมแม่น้ำเจ้าพระยา กรุงเทพมหานคร**

---

## 📖 แนะนำโครงการ (Project Overview)

**Community Shield (ประชาอารักษ์)** คือระบบสนับสนุนการตัดสินใจและการลงมือปฏิบัติการเพื่อรับมือภัยพิบัติในระดับชุมชนเมือง (Urban Community Disaster Resilience) ที่พัฒนาขึ้นโดยใช้ **100% Bun + React Native** ครอบคลุมทั้ง **Web App (ศูนย์บัญชาการเหตุการณ์)** และ **Mobile App (ทีมกู้ภัยภาคสนาม & ประชาชน)** จากฐานรหัสเดียว (Universal Monorepo)

ระบบถูกออกแบบมาเพื่อแก้ปัญหาของระบบเตือนภัยแบบดั้งเดิมที่ทำได้เพียง *"แจ้งเตือนว่าน้ำกำลังมา"* โดยยกระดับสู่ปรัชญา:
$$\text{Data} \longrightarrow \text{Meaning} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Feedback}$$

---

## 🎯 ฟีเจอร์หลัก (Key Highlights จากเอกสารสรุป 60 ข้อ)

1. **3D Interactive Community Simulation Viewport**:
   - จำลองแผนผัง 3D ของชุมชนวัดเทวราชกุญชร (สเกล 200 x 190 เมตร) บ้าน 16 หลัง อาคารสาธารณะ 2 แห่ง สะพานข้ามคลอง และตรอกซอกซอย
   - ผิวน้ำ 3D ยกตัวขึ้นแบบไดนามิกตามตัวเลื่อนเวลา (20:00 $\rightarrow$ 21:00 $\rightarrow$ 22:00) แสดงผลกระทบต่อน้ำท่วมทางเดินหน้าบ้าน A-012 แบบเรียลไทม์
2. **Dual-Line Water Level & AI Forecast Chart**:
   - 🟢 **เส้นสีเขียว (Actual)**: ระดับน้ำตรวจวัดจริงจากเซนเซอร์ (20:00 = 0.42m $\rightarrow$ 20:30 = 0.55m $\rightarrow$ 21:00 = 0.72m)
   - 🟠 **เส้นสีส้ม (AI Forecast)**: พยากรณ์ระดับน้ำล่วงหน้าตามอัตราการเพิ่ม (+0.17m/30m) และปริมาณฝน (21:30 = 0.84m $\rightarrow$ 22:00 = 1.00m)
   - ขีดระดับวิกฤต (Critical Threshold) 1.00 เมตร ชัดเจน
3. **⏱️ Preparation Window (ช่วงเวลาเตรียมการ)**:
   - แปลงผลการพยากรณ์เป็นเวลานับถอยหลัง (เช่น เหลือเวลา 2 ชั่วโมง) พร้อม Checklist ปฏิบัติการ 4 ด้าน:
     - 👥 **คน (People)**: ตรวจสอบผู้ป่วยติดเตียงและครัวเรือนที่ไม่มีมือถือ
     - 🗺️ **พื้นที่ (Area)**: ตรวจสะพานไม้ยกสูงและจุดระบายน้ำคอขวด
     - 🚑 **ทรัพยากร (Resource)**: สแตนด์บายทีมกู้ภัย Community Team 02 และรถ EMS ณ จุด B
     - 📋 **แผน (Plan)**: ตรวจสอบความจุศูนย์พักพิง Shelter A (100 คน / รับแล้ว 82 / เหลือ 18) และเส้นทาง รพ.วชิรพยาบาล
4. **🎨 ระบบสีสถานะคู่ (Dual Status Color System)**:
   - 🌊 **สีพื้นที่ = ระดับภัย**: 🟢 ปกติ | 🟡 เฝ้าระวัง | 🟠 เสี่ยงสูง | 🔴 วิกฤต
   - 🏠 **สีบ้าน = สถานะการช่วยเหลือ**: 🟢 ยืนยันปลอดภัย | 🟡 ต้องติดตาม | 🟠 เข้าถึงยาก | 🔴 ต้องการความช่วยเหลือเร่งด่วน
   - **หลักการสำคัญ**: *"ไม่มีมือถือ ≠ เสี่ยงสูง"* และ *"ไม่มีมือถือ ≠ ไม่มีตัวตนในระบบ"*
5. **🚨 Killer Demo Scenario (บ้าน A-012 ยายสมจิตร)**:
   - ผู้ป่วยติดเตียง อายุ 82 ปี ออกซิเจนสำรองเหลือ 90 นาที น้ำท่วมซอย 35 ซม. รถพยาบาลเข้าไม่ได้
   - AI เปรียบเทียบ 3 แผน:
     - **Plan A (Direct EMS)**: รถพยาบาลเข้าตรง $\rightarrow$ *[เป็นไปไม่ได้: ซอยแคบ น้ำท่วม]*
     - **Plan B (Community Relay)**: **[แนะนำ 92%]** ทีมชุมชน 02 แบกเปลบนสะพานไม้ $\rightarrow$ จุด Medical Point B $\rightarrow$ ส่งต่อรถ EMS
     - **Plan C (Early Evacuation)**: เข้า Shelter ชุมชน $\rightarrow$ *[เป็นไปไม่ได้: ศูนย์พักพิงใกล้เต็มและไม่มีออกซิเจนสำรอง]*
   - **Human-in-the-loop**: ผู้บัญชาการกดปุ่ม `[อนุมัติ Plan B]` ระบบจึงจะออกใบงาน `TASK #A-012`
6. **📱 Field Responder Mobile App & Dynamic Replanning**:
   - ทีมกู้ภัยรับงานผ่านมือถือ: `รับงาน` $\rightarrow$ `เดินทาง` $\rightarrow$ `ถึงพื้นที่` $\rightarrow$ `รายงานหน้างาน`
   - เมื่อทีมรายงานว่า *"สะพานไม้ทางแยก 2 จมน้ำ 45 ซม."* $\rightarrow$ ระบบขึ้นแบนเนอร์แจ้งเตือน ⚠️ *"DYNAMIC REPLANNING"* และคำนวณเส้นทางเลี่ยงผ่านหน้าศูนย์ชุมชนทันที!

---

## 🛠️ โครงสร้างเทคโนโลยี (Technology Stack)

- **Runtime, Package Manager & API**: **Bun (v1.1+)**
- **Frontend Core**: **React Native (Universal via Expo & React Native Web)**
- **Styling**: **NativeWind / Tailwind CSS & React Native StyleSheet**
- **3D Graphics**: **Three.js / React Three Fiber / WebGL**
- **State Management**: **Zustand / React Context**
- **Offline Storage**: **OP-SQLite / MMKV Storage**

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started with Bun)

### 1. ติดตั้ง Dependencies
```bash
bun install
```

### 2. รัน Bun Backend API Server (Port 3001)
```bash
bun run dev:api
```
*API Endpoints พร้อมใช้งานที่ `http://localhost:3001` (WebSocket: `ws://localhost:3001/ws`)*

### 3. รัน Universal React Native App (Web & Mobile)
```bash
bun run dev:app
```
*เปิดดูผ่าน Web Browser ที่ `http://localhost:8081` หรือเปิดผ่าน Expo Go บนอุปกรณ์ iOS/Android*

---

## 📂 โครงสร้างไฟล์ในโครงการ

```text
Thai_Community/
├── package.json                         # Bun workspace configuration
├── tsconfig.json                        # TypeScript base configuration
├── COMMUNITY_SHIELD_ARCHITECTURE_PLAN.md# พิมพ์เขียวสถาปัตยกรรมระบบฉบับเต็ม
│
├── apps/
│   ├── api/                             # Bun Backend Server
│   │   ├── src/index.ts                 # High-Performance Bun.serve & WebSockets
│   │   └── package.json
│   │
│   └── app/                             # Universal React Native (Web + Mobile)
│       ├── src/
│       │   ├── App.tsx                  # แอปพลิเคชันหลัก Universal App
│       │   ├── components/
│       │   │   ├── Header.tsx           # แถบหัวระบบ & สลับโหมด Desktop/Mobile
│       │   │   ├── TimelineControls.tsx # แถบเลื่อนเวลาจำลองสถานการณ์ 8 ขั้น
│       │   │   ├── Community3DViewer.tsx# 3D Viewport ผิวน้ำไดนามิก & หมุด A-012
│       │   │   ├── WaterLevelChart.tsx  # กราฟเส้นเขียว/ส้ม & อัตราการเพิ่ม
│       │   │   ├── PreparationWindowCard.tsx # ⏱️ นับถอยหลัง 2 ชม. & Checklist
│       │   │   ├── HouseholdsBoard.tsx  # ตารางสถานะคู่ 16 หลังคาเรือน
│       │   │   ├── DecisionPanel.tsx    # แผง 3 แผนช่วยเหลือ & ปุ่มอนุมัติ จนท.
│       │   │   ├── MobileFieldTaskView.tsx # หน้าจอมือถือทีมกู้ภัยภาคสนาม
│       │   │   ├── FieldReportModal.tsx # ฟอร์มรายงานระดับน้ำ & สะพานไม้จม
│       │   │   ├── CitizenSosModal.tsx  # แจ้งเหตุฉุกเฉิน & บันทึกเสียงประชาชน
│       │   │   └── ReplanningBanner.tsx # แบนเนอร์เตือน Dynamic Replanning
│       │   └── index.tsx                # Entrypoint
│       ├── app.json                     # Expo configuration
│       ├── metro.config.js              # Metro bundler config
│       └── package.json
│
└── packages/
    └── shared/                          # โมเดลและฟังก์ชันที่แชร์กัน 100%
        ├── src/
        │   ├── types/index.ts           # Type definitions
        │   ├── constants/index.ts       # ฐานข้อมูลบ้าน 16 หลัง, แผน A/B/C, Timeline
        │   ├── utils/index.ts           # AI Explainability, คำนวณความเสี่ยง
        │   └── index.ts
        └── package.json
```

---

## 🎬 ขั้นตอนการสาธิตระบบ (Killer Demo Walkthrough)

1. **20:00 น.**: สังเกตกราฟระดับน้ำจริง (เส้นเขียว) อยู่ที่ 0.42 m อัตราเพิ่ม +0.17 m / 30 นาที ฝนตกต่อเนื่อง
2. **20:10 น.**: AI Forecast พยากรณ์ระดับน้ำแตะ 1.00 m เวลา 22:00 น. (เส้นส้ม) $\rightarrow$ ระบบเปิดโหมด **⏱️ Preparation Window ≈ 2 ชั่วโมง**
3. **20:15 น.**: แผนที่และ 3D ปรับ Zone C เป็นสีส้ม (เสี่ยงสูง) จากสภาพพื้นที่ต่ำและน้ำระบายช้า
4. **20:20 น.**: เกิดเหตุวิกฤต **บ้าน A-012** (ยายสมจิตร ผู้ป่วยติดเตียง ออกซิเจนสำรองเหลือ 90 นาที น้ำท่วมซอย 35 ซม.)
5. **20:22 น.**: AI เสนอ 3 แผนช่วยเหลือบนแผงควบคุม โดยแนะนำ **Plan B (Community Relay)**
6. **20:23 น.**: ผู้บัญชาการกดปุ่ม **`[✓ อนุมัติ Plan B]`** $\rightarrow$ ระบบออกใบงาน **TASK #A-012** มอบหมายทีม Community Team 02
7. **20:30 น.**: กดสลับเป็นโหมด **📱 ทีมกู้ภัยภาคสนาม** $\rightarrow$ กด `[ถ่ายภาพ & รายงานระดับน้ำจริง]` ระบุสะพานไม้แยก 2 จมน้ำ 45 ซม.
8. **20:32 น.**: ระบบเด้งแบนเนอร์ **⚠️ DYNAMIC REPLANNING** แสดงเส้นทางเลี่ยงผ่านหน้าศูนย์ชุมชน นำส่งผู้ป่วยต่อรถพยาบาล EMS สู่ รพ.วชิรพยาบาล ได้อย่างปลอดภัย!

---

## 🚀 การติดตั้งและเปิดใช้งานจริง (Production Deployment)

ระบบได้รับการแพ็กเกจเป็น **Standalone Native Executable** รันบน External SSD (`/Volumes/MAC/Thai_Community`) สมบูรณ์ 100%

### คำสั่งควบคุมระบบ (CLI Operations)
```bash
# 1. คอมไพล์โปรดักชันไบนารี และตรวจเช็กความพร้อมระบบ
/Volumes/MAC/Thai_Community/deploy.sh

# 2. เริ่มการทำงานของเซอร์วิสในเบื้องหลัง (Port 3000)
/Volumes/MAC/Thai_Community/start.sh

# 3. ตรวจสอบสถานะการทำงาน, อัตราใช้ RAM, และระดับน้ำปัจจุบัน
/Volumes/MAC/Thai_Community/status.sh

# 4. หยุดการทำงานของเซอร์วิสอย่างปลอดภัย
/Volumes/MAC/Thai_Community/stop.sh
```

### จุดเชื่อมต่อระบบ (Network Access Endpoints)
- **🌐 Vercel Cloud Production (ออนไลน์ทั่วโลก)**: [https://thai-community-shield.vercel.app](https://thai-community-shield.vercel.app)
- **🖥️ ศูนย์บัญชาการทัองถิ่น (Local Command Center)**: [http://localhost:3000](http://localhost:3000)
- **📱 ทีมกู้ภัยภาคสนาม (Field Responders บน Wi-Fi / Hotspot)**: `http://172.20.10.2:3000`
- **⚡ Real-time Live WebSocket Bus**: `ws://localhost:3000/ws`
- **💓 Health Check Endpoint**: `http://localhost:3000/api/health` หรือ `https://thai-community-shield.vercel.app/api/health`
- **🧊 3D Community Model CDN**: `https://thai-community-shield.vercel.app/model.glb` (9.1 MB)
- **📶 PWA & Offline Disaster Resilience**: รองรับการกด "Add to Home Screen" บน iOS Safari และ Android Chrome พร้อม Service Worker แคชโมเดล 3 มิติและส่วนติดต่อผู้ใช้ออฟไลน์ 100%
- **📱 Mobile-First Responsive Apple HIG**: หน้าต่าง Modal ทุกบานแปลงเป็น iOS Bottom Sheet อัตโนมัติเมื่อเปิดบนสมาร์ตโฟน พร้อมรองรับ Dynamic Island และ Safe-Area Insets เต็มรูปแบบ


