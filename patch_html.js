const fs = require('fs');

const files = [
  '/Volumes/MAC/Thai_Community/server/public/index.html',
  '/Volumes/MAC/Thai_Community/public/index.html'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("Not found:", file);
    continue;
  }
  let html = fs.readFileSync(file, 'utf8');

  // 1. Force Light Theme
  html = html.replace('let currentTheme = localStorage.getItem("theme") || "dark";', 'let currentTheme = "light";');

  // 2. Add New Tabs (Nurse & Citizen)
  const oldTabs = `<button class="seg-btn" id="tab-mobile" onclick="setAppMode('mobile')">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
          </svg>
          <span class="seg-label-desktop">ทีมกู้ภัยภาคสนาม</span>
          <span class="seg-label-mobile">กู้ภัย</span>
        </button>`;
        
  const newTabs = `<button class="seg-btn" id="tab-nurse" onclick="setAppMode('nurse')">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
          </svg>
          <span class="seg-label-desktop">พยาบาล</span>
          <span class="seg-label-mobile">พยาบาล</span>
        </button>
        <button class="seg-btn" id="tab-citizen" onclick="setAppMode('citizen')">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span class="seg-label-desktop">ประชาชน</span>
          <span class="seg-label-mobile">ประชาชน</span>
        </button>`;
  
  if (html.includes('id="tab-mobile"')) {
    html = html.replace(oldTabs, newTabs);
  }

  // 3. Add Hazard Selector to Header Center
  const oldHeaderCenter = `<div class="header-center">
      <div class="status-capsule">
        <div class="pulse-dot" id="live-dot"></div>
        <span class="status-label" style="color:var(--text-secondary);">เวลาจำลอง:</span>
        <span id="sim-clock-display" style="font-weight:600; color:var(--text-primary);">20:00 น.</span>
      </div>
    </div>`;
    
  const newHeaderCenter = `<div class="header-center">
      <select id="disaster-mode-selector" onchange="changeDisasterMode(this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid var(--border-subtle); background:var(--surface-card); color:var(--text-primary); font-size:12px; font-weight:600;">
        <option value="flood">อุทกภัย (Flood)</option>
        <option value="earthquake">แผ่นดินไหว (Earthquake)</option>
        <option value="wildfire">ไฟป่า (Wildfire)</option>
        <option value="tsunami">สึนามิ (Tsunami)</option>
      </select>
      <div class="status-capsule">
        <div class="pulse-dot" id="live-dot"></div>
        <span class="status-label" style="color:var(--text-secondary);">เวลาจำลอง:</span>
        <span id="sim-clock-display" style="font-weight:600; color:var(--text-primary);">20:00 น.</span>
      </div>
    </div>`;
    
  if (html.includes('class="header-center"')) {
    html = html.replace(oldHeaderCenter, newHeaderCenter);
  }

  // 4. Update renderChart to be a dual-line chart
  if (!html.includes('Dual-Line Chart')) {
    const oldChart = `function renderChart(level, threshold) {
      const canvas = document.getElementById('chart-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);
      
      // Draw threshold line
      const thY = h - ((threshold - 0) / 1.5) * h;
      ctx.strokeStyle = '#D70015';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, thY);
      ctx.lineTo(w, thY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw actual level bar
      const barW = Math.min(60, w * 0.2);
      const barX = (w - barW) / 2;
      const barH = ((level - 0) / 1.5) * h;
      const barY = h - barH;
      
      const grad = ctx.createLinearGradient(0, barY, 0, h);
      grad.addColorStop(0, '#0071E3');
      grad.addColorStop(1, 'rgba(0,113,227,0.3)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, [6, 6, 0, 0]);
      ctx.fill();
      
      // Label
      ctx.fillStyle = currentTheme === 'dark' ? '#FFF' : '#1D1D1F';
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(level.toFixed(2) + ' ม.', w / 2, barY - 8);
    }`;

    const newChart = `// Dual-Line Chart (Apple HIG Style)
    function renderChart(level, forecast, threshold) {
      const canvas = document.getElementById('chart-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      
      // Handle HiDPI displays
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      const w = rect.width;
      const h = rect.height;
      const padding = 20;
      
      ctx.clearRect(0, 0, w, h);
      
      const maxVal = Math.max(1.5, forecast + 0.2, level + 0.2, threshold + 0.2);
      
      function getY(val) {
        return h - padding - ((val / maxVal) * (h - padding * 2));
      }
      
      // Draw Threshold Line (Red)
      const thY = getY(threshold);
      ctx.strokeStyle = 'rgba(215, 0, 21, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, thY);
      ctx.lineTo(w - padding, thY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw Actual Level Line (Green)
      ctx.strokeStyle = '#1E8E3E';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(padding, getY(0.42)); // Start
      ctx.lineTo(w/2 - 10, getY(level)); // Current
      ctx.stroke();
      
      // Draw Forecast Level Line (Orange)
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(w/2 - 10, getY(level));
      ctx.lineTo(w - padding, getY(forecast));
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw Current Point
      ctx.fillStyle = '#1E8E3E';
      ctx.beginPath();
      ctx.arc(w/2 - 10, getY(level), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(w/2 - 10, getY(level), 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw Labels
      ctx.fillStyle = currentTheme === 'dark' ? '#FFF' : '#1D1D1F';
      ctx.font = '600 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Actual: ' + level.toFixed(2) + 'm', w/2 - 10, getY(level) - 10);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText('Forecast: ' + forecast.toFixed(2) + 'm', w - padding - 20, getY(forecast) - 10);
      ctx.fillStyle = '#D70015';
      ctx.textAlign = 'left';
      ctx.fillText('Threshold', padding, thY - 5);
    }`;

    // Need to do regex replace in case the old chart function varies slightly
    const chartRegex = /function renderChart\(.*?\) \{[\s\S]*?\n\s*\}/;
    html = html.replace(chartRegex, newChart);
  }

  // 5. Update renderApp to call renderChart(level, forecast, threshold)
  // Search for: renderChart(state.hydrology.waterLevelMeters, 0.70);
  html = html.replace(/renderChart\(state\.hydrology\.waterLevelMeters, 0\.70\);/, 'renderChart(state.hydrology.waterLevelMeters, state.hydrology.forecastLevel2200 || 1.0, 0.70);');

  // 6. Add JS for changeDisasterMode and new tab switching
  if (!html.includes('function changeDisasterMode')) {
    const jsAddition = `
    async function changeDisasterMode(mode) {
      try {
        const res = await fetch(API_BASE + '/api/disaster-mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode })
        });
        if(res.ok) {
          const data = await res.json();
          renderApp(data.state);
        }
      } catch (err) { console.error('Change Disaster Mode Error:', err); }
    }
    `;
    html = html.replace('// Initialization', jsAddition + '\n    // Initialization');
  }

  fs.writeFileSync(file, html);
}
