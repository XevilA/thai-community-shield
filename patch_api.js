const fs = require('fs');
let code = fs.readFileSync('/Volumes/MAC/Thai_Community/api/index.ts', 'utf8');

// Add currentDisasterMode to state
if (!code.includes('let currentDisasterMode =')) {
  code = code.replace('let currentStepIndex = 0;', 'let currentStepIndex = 0;\nlet currentDisasterMode = "flood";');
}

// Add getDisasterData
if (!code.includes('function getDisasterData')) {
  const getDisasterDataCode = `
function getDisasterData(mode, step) {
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
`;
  code = code.replace('// --- STATE MANAGEMENT ---', '// --- STATE MANAGEMENT ---\n' + getDisasterDataCode);
}

// Add disasterMode and disasterData to getSystemState return
if (!code.includes('disasterMode:')) {
  code = code.replace('timeline: {', 'disasterMode: currentDisasterMode,\n    disasterData: getDisasterData(currentDisasterMode, step),\n    timeline: {');
}

// Add /api/disaster-mode endpoint
if (!code.includes('/api/disaster-mode')) {
  const endpointCode = `
    // 13. Disaster Mode
    if (urlPath === '/api/disaster-mode' || urlPath.endsWith('/disaster-mode')) {
      const body = req.body || {};
      const { mode } = body;
      if (['flood', 'earthquake', 'wildfire', 'tsunami'].includes(mode)) {
        currentDisasterMode = mode;
        return json({ success: true, mode, state: getSystemState() });
      }
      return json({ error: 'Invalid mode' }, 400);
    }
`;
  code = code.replace('// Default fallback', endpointCode + '\n    // Default fallback');
}

fs.writeFileSync('/Volumes/MAC/Thai_Community/api/index.ts', code);
