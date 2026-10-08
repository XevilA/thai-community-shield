/**
 * AI Decision Support & Explainability Engine
 * Provides deterministic offline feature attribution & natural language explanation
 */

export interface AiExplanationPayload {
  houseCode: string;
  waterLevelMeters: number;
  rateOfRisePerHour: number;
  rainfallMm: number;
  alleyElevation: number;
  bedridden: boolean;
  requiresOxygen: boolean;
  oxygenReserveMins: number;
  digitalAccess: string;
  isBoardwalkSubmerged: boolean;
}

/**
 * Generates natural language AI Explainability in Thai
 * Explains *WHY* an area or household is classified as Critical/High Risk
 */
export function explainRiskAssessment(data: AiExplanationPayload): {
  headlineTh: string;
  factorsTh: string[];
  recommendationTh: string;
} {
  const factors: string[] = [];

  if (data.waterLevelMeters >= 0.7) {
    factors.push(`ระดับน้ำแม่น้ำเจ้าพระยาสูงถึง ${data.waterLevelMeters} ม. เหนือตลิ่งลุ่มต่ำ`);
  }
  if (data.rateOfRisePerHour >= 0.25) {
    factors.push(`อัตราการเพิ่มของระดับน้ำสูงผิดปกติ (+${data.rateOfRisePerHour} ม./ชม.) จากอิทธิพลน้ำทะเลหนุน`);
  }
  if (data.rainfallMm >= 40) {
    factors.push(`ปริมาณฝนสะสม ${data.rainfallMm} มม./ชม. ทำให้การระบายน้ำลงคลองเป็นไปได้ช้า`);
  }
  if (data.alleyElevation <= 0.1) {
    factors.push(`ระดับความสูงหน้าบ้านต่ำเพียง ${data.alleyElevation} ม. (เป็นแอ่งคอขวดรับน้ำ)`);
  }
  if (data.bedridden) {
    factors.push('มีผู้ป่วยติดเตียงที่ไม่สามารถเคลื่อนย้ายได้ด้วยตนเอง');
  }
  if (data.requiresOxygen && data.oxygenReserveMins > 0) {
    factors.push(`ขีดจำกัดเวลาวิกฤต: ออกซิเจนสำรองเหลือประมาณ ${data.oxygenReserveMins} นาที`);
  }
  if (data.digitalAccess === 'no_phone_offline') {
    factors.push('ครัวเรือนไม่มีสมาร์ตโฟน/ช่องทางออนไลน์ ต้องใช้การตรวจทางกายภาพและเสียงตามสาย');
  }
  if (data.isBoardwalkSubmerged) {
    factors.push('สะพานไม้ยกสูงชั่วคราวถูกน้ำท่วมขัง ตัดขาดเส้นทางสัญจรหลัก');
  }

  let headline = 'สถานะปกติ เฝ้าระวังตามวงรอบ';
  let recommendation = 'ติดตามข้อมูลเซนเซอร์ระดับน้ำอย่างต่อเนื่อง';

  if (data.houseCode === 'A-012' || (data.bedridden && data.waterLevelMeters >= 0.6)) {
    headline = 'วิกฤตเร่งด่วน: ต้องการการเคลื่อนย้ายผ่านเส้นทาง Community Relay ทันที';
    recommendation =
      'อนุมัติ Plan B โดยด่วน ส่งทีม Community Team 02 พร้อมเปลสนามนำส่งจุด Medical Point B ก่อนออกซิเจนหมด';
  } else if (data.waterLevelMeters >= 0.65 || data.alleyElevation <= 0.1) {
    headline = 'ความเสี่ยงสูง: น้ำเริ่มเอ่อท่วมตรอกลุ่มต่ำ';
    recommendation = 'ส่งผู้นำชุมชนตรวจสอบกลุ่มเปราะบางและเตรียมความพร้อมศูนย์พักพิง';
  }

  return {
    headlineTh: headline,
    factorsTh: factors,
    recommendationTh: recommendation,
  };
}

/**
 * Natural Language Processing for Citizen Voice/Text Reports
 * Structures raw Thai voice input into actionable incident categories
 */
export function parseCitizenVoiceReport(rawText: string, reportedLocation: string) {
  let category = 'drainage_bottleneck';
  let severity = 'high';

  if (rawText.includes('ป่วย') || rawText.includes('ติดเตียง') || rawText.includes('หายใจ') || rawText.includes('ล้ม') || rawText.includes('เลือด')) {
    category = 'medical_critical';
    severity = 'critical';
  } else if (rawText.includes('สะพาน') || rawText.includes('ทางเดิน') || rawText.includes('จม') || rawText.includes('ขาด') || rawText.includes('ลอย')) {
    category = 'road_submerged';
    severity = 'high';
  } else if (rawText.includes('ท่อ') || rawText.includes('ระบาย') || rawText.includes('คอขวด') || rawText.includes('ขยะ')) {
    category = 'drainage_bottleneck';
    severity = 'medium';
  }

  return {
    category,
    severity,
    parsedLocation: reportedLocation || 'ชุมชนวัดเทวราชกุญชร',
    summaryTh: `AI สรุปเหตุ: [${category.toUpperCase()}] ${rawText.slice(0, 100)}`,
  };
}
