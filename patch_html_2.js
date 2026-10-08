const fs = require('fs');
const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');

  // 1. Fix 3D Model Rendering Fallback Material
  if (!html.includes('color = 0xd4d4d4; // Default fallback architecture color')) {
    html = html.replace('if (color !== null) {', `if (color === null) color = 0xd4d4d4; // Default fallback architecture color\n          if (color !== null) {`);
  }

  // 2. Add Animations for Earthquake, Wildfire, Tsunami
  if (!html.includes('// Disaster Animation Logic')) {
    const disasterAnim = `
        // Disaster Animation Logic
        const disasterMode = state?.disasterMode || 'flood';
        if (disasterMode === 'earthquake') {
            const shake = Math.sin(t * 15) * 0.15;
            camera.position.x += shake;
            camera.position.z += shake;
        } else if (disasterMode === 'wildfire') {
            scene.background = new THREE.Color('#3b1a0d');
            scene.fog = new THREE.FogExp2('#3b1a0d', 0.015);
        } else if (disasterMode === 'tsunami') {
            targetCanalY = 4.5;
            targetFloodY = 4.5;
        } else {
            scene.background = new THREE.Color(currentTheme === 'dark' ? '#070B14' : '#D4DFE8');
            scene.fog = null;
        }
    `;
    html = html.replace('// Longitudinal flowing waves along canal', disasterAnim + '\n          // Longitudinal flowing waves along canal');
  }

  // 3. Add Citizen and Nurse Modals
  if (!html.includes('id="citizen-registry-modal"')) {
    const modals = `
  <!-- Citizen Registry Modal -->
  <div class="modal-backdrop" id="citizen-registry-modal" onclick="if(event.target===this) closeModal('citizen-registry-modal')">
    <div class="modal-dialog">
      <div class="modal-drag-handle"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title">ทะเบียนข้อมูลประชาชน (Citizen Registry)</h3>
        <button class="modal-close-btn" onclick="closeModal('citizen-registry-modal')">×</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <input type="text" class="input-field" id="cit-house" placeholder="บ้านเลขที่ (เช่น A-012)" value="A-012">
        <select class="input-field" id="cit-status">
          <option value="confirmed_safe">ปกติ (Confirmed Safe)</option>
          <option value="followup_needed">เฝ้าระวัง (Follow-up Needed)</option>
          <option value="critical_help_needed" selected>วิกฤต (Critical Help Needed)</option>
        </select>
        <button class="btn-step primary" onclick="updateCitizenRegistry()" style="width:100%; justify-content:center; font-size:14px; padding:10px;">บันทึกข้อมูลลง SQLite</button>
      </div>
    </div>
  </div>

  <!-- Nurse Triage Modal -->
  <div class="modal-backdrop" id="nurse-triage-modal" onclick="if(event.target===this) closeModal('nurse-triage-modal')">
    <div class="modal-dialog">
      <div class="modal-drag-handle"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 class="modal-title">ระบบคัดกรองพยาบาล (Nurse Triage)</h3>
        <button class="modal-close-btn" onclick="closeModal('nurse-triage-modal')">×</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="incident-panel">
          <div class="incident-badge">ผู้ป่วยวิกฤต: ยายสมจิตร</div>
          <div class="incident-headline" style="color:#FFF;">ออกซิเจนเหลือ 90 นาที</div>
          <p style="color:rgba(255,255,255,0.8); font-size:11px; margin-top:4px;">ระดับน้ำท่วมซอย 35 ซม. (รถพยาบาลเข้าไม่ได้)</p>
        </div>
        <button class="btn-step primary" onclick="approvePlanB()" style="width:100%; justify-content:center; font-size:14px; padding:10px;">อนุมัติแผน B: ทีมเปลสนาม</button>
      </div>
    </div>
  </div>
`;
    html = html.replace('<!-- Dynamic Replanning Notification Banner -->', modals + '\n  <!-- Dynamic Replanning Notification Banner -->');
  }

  // 4. Update Tab Content Logic
  if (!html.includes('function setAppMode')) {
    html = html.replace('function setAppMode', 'function oldSetAppMode');
  }
  
  const setAppModeLogic = `
    function setAppMode(mode) {
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + mode).classList.add('active');
      
      const mainContent = document.querySelector('main');
      if (mode === 'command') {
        // We will keep the default layout
        renderApp(state); 
      } else if (mode === 'nurse') {
        openModal('nurse-triage-modal');
      } else if (mode === 'citizen') {
        openModal('citizen-registry-modal');
      }
    }
    
    async function updateCitizenRegistry() {
      const code = document.getElementById('cit-house').value;
      const access = document.getElementById('cit-status').value;
      try {
        const res = await fetch(API_BASE + '/api/household/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, access_status: access })
        });
        if(res.ok) {
          closeModal('citizen-registry-modal');
        }
      } catch (err) {}
    }
    
    async function approvePlanB() {
      try {
        const res = await fetch(API_BASE + '/api/approve-plan', { method: 'POST' });
        if(res.ok) {
          closeModal('nurse-triage-modal');
        }
      } catch (err) {}
    }
  `;
  
  if (!html.includes('async function updateCitizenRegistry')) {
     html = html.replace('function resetDemo() {', setAppModeLogic + '\n    function resetDemo() {');
  }

  fs.writeFileSync(file, html);
}
