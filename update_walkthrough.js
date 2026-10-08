const fs = require('fs');
let text = fs.readFileSync('/Users/dotmini/.gemini/antigravity/brain/e8e5741a-4288-43a4-9b85-998c76854851/walkthrough.md', 'utf8');

const newSection = `
### 8. อัปเดตล่าสุด: การแสดงผลการตัดสินใจครบวงจร (End-to-End Decision Flows)
1. **เพิ่มแถบการนำทางหลัก (Segmented Control)** ประกอบด้วย: ศูนย์บัญชาการ, พยาบาล, ประชาชน
2. **Citizen Registry & Nurse Triage**:
   - เพิ่ม Modal 2 ตัวที่ทำงานได้จริง (เชื่อมต่อ SQLite API) 
   - สามารถปรับสถานะลูกบ้านและกดยืนยันให้ใช้งาน Plan B ได้โดยตรง
3. **การจำลอง 4 ภัยพิบัติ (Multi-Hazard Simulation)**:
   - เพิ่มระบบเปลี่ยนโหมดภัยพิบัติ (อุทกภัย, แผ่นดินไหว, ไฟป่า, สึนามิ) 
   - รองรับแอนิเมชันสำหรับ 4 รูปแบบ เช่น การสั่นสะเทือน, สีบรรยากาศหมอกควันไฟป่า
4. **กราฟเส้นคู่แบบ Apple HIG (Dual-Line Chart)**:
   - กราฟถูกเขียนขึ้นใหม่ด้วย Canvas ` + "`" + `lineTo()` + "`" + `
   - แสดงระดับจริง (เส้นสีเขียว) และการคาดการณ์ของ AI (เส้นประสีส้ม) พร้อมเส้นเตือนวิกฤต (เส้นประสีแดง)
5. **แก้บั๊ก 3D Model และเปิดใช้งาน Light Theme เป็นค่าเริ่มต้น**
`;

text += newSection;
fs.writeFileSync('/Users/dotmini/.gemini/antigravity/brain/e8e5741a-4288-43a4-9b85-998c76854851/walkthrough.md', text);
