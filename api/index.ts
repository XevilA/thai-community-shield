/**
 * Community Shield (ประชาอารักษ์) — Vercel Serverless Function
 * Pure TypeScript Engine: Hydrology Physics, Dijkstra Pathfinder, AI Explainability & Real State
 * Compatible with Node.js 18, 20, 22 on Vercel Serverless
 */

declare const Buffer: any;

// --- DATASET DEFINITIONS ---

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

function getBaselineHouseholds() {
  return [
    { id: 'h-01', code: 'A-001', title: 'บ้านริมคลอง 1', address: '12/1 ซอยวัดเทวราชกุญชร', zone: 'Zone A', coord_x: -77, coord_y: -3, coord_z: 0, house_type: 'House_Type_A_Gable', floor_elevation: 0.55, alley_elevation: 0.15, digital_access: 'online', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: 'บ้านชั้นเดียวพื้นปูน' },
    { id: 'h-02', code: 'A-002', title: 'บ้านเรือนไทยยกพื้น', address: '12/2 ซอยวัดเทวราชกุญชร', zone: 'Zone A', coord_x: -77, coord_y: 32, coord_z: 0, house_type: 'House_Type_D_Raised_Timber', floor_elevation: 1.65, alley_elevation: 0.15, digital_access: 'phone_only', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: 'ใต้ถุนสูง 1.65 ม. รอดพ้นน้ำท่วม' },
    { id: 'h-03', code: 'A-003', title: 'บ้านปั้นหยาซอย 1', address: '14 ซอยวัดเทวราชกุญชร', zone: 'Zone A', coord_x: -77, coord_y: 52, coord_z: 0, house_type: 'House_Type_B_Hip', floor_elevation: 0.55, alley_elevation: 0.15, digital_access: 'online', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-04', code: 'A-004', title: 'บ้านสองชั้นริมเหนือ', address: '16 ซอยวัดเทวราชกุญชร', zone: 'Zone A', coord_x: -77, coord_y: 78, coord_z: 0, house_type: 'House_Type_C_Two_Storey', floor_elevation: 0.55, alley_elevation: 0.20, digital_access: 'online', area_risk: 'normal', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-05', code: 'A-005', title: 'บ้านปั้นหยาซอย 2', address: '18 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -29, coord_y: -4, coord_z: 0, house_type: 'House_Type_B_Hip', floor_elevation: 0.55, alley_elevation: 0.10, digital_access: 'online', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-06', code: 'A-006', title: 'บ้านสองชั้นซอยกลาง', address: '20 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -28, coord_y: 23, coord_z: 0, house_type: 'House_Type_C_Two_Storey', floor_elevation: 0.55, alley_elevation: 0.10, digital_access: 'online', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-07', code: 'A-007', title: 'บ้านไม้ใต้ถุนสูงซอย 2', address: '22 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -27, coord_y: 44, coord_z: 0, house_type: 'House_Type_D_Raised_Timber', floor_elevation: 1.65, alley_elevation: 0.12, digital_access: 'phone_only', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-08', code: 'A-008', title: 'บ้านจั่วซอยตะวันออก 1', address: '24 ซอยวัดเทวราชกุญชร', zone: 'Zone C', coord_x: -5, coord_y: -3, coord_z: 0, house_type: 'House_Type_A_Gable', floor_elevation: 0.55, alley_elevation: 0.08, digital_access: 'online', area_risk: 'high_risk', access_status: 'followup_needed', special_notes: 'พื้นที่ต่ำ' },
    { id: 'h-09', code: 'A-009', title: 'บ้านไม้ใต้ถุนสูงริมคู', address: '26 ซอยวัดเทวราชกุญชร', zone: 'Zone C', coord_x: -5, coord_y: 23, coord_z: 0, house_type: 'House_Type_D_Raised_Timber', floor_elevation: 1.65, alley_elevation: 0.08, digital_access: 'online', area_risk: 'high_risk', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-10', code: 'A-010', title: 'บ้านปั้นหยาซอยตะวันออก 2', address: '28 ซอยวัดเทวราชกุญชร', zone: 'Zone C', coord_x: -4, coord_y: 44, coord_z: 0, house_type: 'House_Type_B_Hip', floor_elevation: 0.55, alley_elevation: 0.09, digital_access: 'online', area_risk: 'high_risk', access_status: 'followup_needed', special_notes: '' },
    { id: 'h-11', code: 'A-011', title: 'บ้านจั่วซอยเหนือ', address: '30 ซอยวัดเทวราชกุญชร', zone: 'Zone D', coord_x: -32, coord_y: 79, coord_z: 0, house_type: 'House_Type_A_Gable', floor_elevation: 0.55, alley_elevation: 0.22, digital_access: 'online', area_risk: 'normal', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-12', code: 'A-012', title: 'บ้านยายสมจิตร (ผู้ป่วยติดเตียง)', address: '32/1 ซอยวัดเทวราชกุญชร (หลังตลาดเก่า)', zone: 'Zone C', coord_x: -7, coord_y: 80, coord_z: 0, house_type: 'House_Type_C_Two_Storey', floor_elevation: 0.55, alley_elevation: 0.05, digital_access: 'no_phone_offline', area_risk: 'critical', access_status: 'critical_help_needed', special_notes: 'ผู้ป่วยติดเตียง ออกซิเจนสำรองเหลือ 90 นาที น้ำท่วมซอยหน้าบ้าน 35 ซม.' },
    { id: 'h-13', code: 'A-013', title: 'บ้านปั้นหยาซอยเหนือตะวันออก', address: '34 ซอยวัดเทวราชกุญชร', zone: 'Zone D', coord_x: 22, coord_y: 80, coord_z: 0, house_type: 'House_Type_B_Hip', floor_elevation: 0.55, alley_elevation: 0.20, digital_access: 'online', area_risk: 'normal', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-14', code: 'A-014', title: 'บ้านไม้ใต้ถุนสูงฝั่งใต้', address: '36 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -77, coord_y: -58, coord_z: 0, house_type: 'House_Type_D_Raised_Timber', floor_elevation: 1.65, alley_elevation: 0.14, digital_access: 'phone_only', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-15', code: 'A-015', title: 'บ้านจั่วฝั่งใต้กลาง', address: '38 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -53, coord_y: -58, coord_z: 0, house_type: 'House_Type_A_Gable', floor_elevation: 0.55, alley_elevation: 0.12, digital_access: 'online', area_risk: 'watch', access_status: 'followup_needed', special_notes: '' },
    { id: 'h-16', code: 'A-016', title: 'บ้านสองชั้นหัวมุมใต้', address: '40 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -26, coord_y: -60, coord_z: 0, house_type: 'House_Type_C_Two_Storey', floor_elevation: 0.55, alley_elevation: 0.15, digital_access: 'online', area_risk: 'normal', access_status: 'confirmed_safe', special_notes: '' },
  ];
}

const WALKWAY_NODES = [
  { id: 'NODE_HOUSE_A012', name: 'บ้าน A-012 (ยายสมจิตร)', x: -7, y: 80, elevation: 0.05, node_type: 'house' },
  { id: 'NODE_ALLEY_NORTH', name: 'ปากตรอกซอยเหนือ', x: -18, y: 80, elevation: 0.15, node_type: 'junction' },
  { id: 'NODE_BOARDWALK_J1', name: 'จุดขึ้นสะพานไม้ทางเหนือ', x: -28, y: 70, elevation: 0.35, node_type: 'boardwalk' },
  { id: 'NODE_BOARDWALK_J2', name: 'สะพานไม้ทางแยก 2 (จุดเสี่ยงจมน้ำ)', x: -28, y: 35, elevation: 0.25, node_type: 'boardwalk' },
  { id: 'NODE_ALLEY_EAST', name: 'ตรอกตะวันออก (หน้าบ้าน A-010)', x: -4, y: 44, elevation: 0.09, node_type: 'junction' },
  { id: 'NODE_COMMUNITY_CENTER', name: 'ลานหน้าศูนย์ชุมชนวัดเทวราชกุญชร', x: -15, y: 10, elevation: 0.45, node_type: 'shelter' },
  { id: 'NODE_TEMPLE_FORECOURT', name: 'ลานหน้าพระอุโบสถวัดเทวราชกุญชร (พื้นที่สูง)', x: 0, y: -20, elevation: 0.65, node_type: 'junction' },
  { id: 'NODE_MEDICAL_POINT_B', name: 'จุดส่งต่อการแพทย์ B (ริมถนนศรีอยุธยา)', x: 15, y: -50, elevation: 0.75, node_type: 'medical_point' },
  { id: 'NODE_PIER_WATER', name: 'ท่าเรือชุมชนวัดเทวราชกุญชร', x: -85, y: 20, elevation: -0.10, node_type: 'bridge' },
  { id: 'NODE_SHELTER_TEMPLE', name: 'ศูนย์พักพิงศาลาการเปรียญ (Shelter A)', x: -20, y: -40, elevation: 0.70, node_type: 'shelter' },
];

const WALKWAY_EDGES = [
  { id: 'E1', source_id: 'NODE_HOUSE_A012', target_id: 'NODE_ALLEY_NORTH', distance_meters: 18, width_meters: 1.4, min_elevation: 0.05, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E2', source_id: 'NODE_ALLEY_NORTH', target_id: 'NODE_BOARDWALK_J1', distance_meters: 15, width_meters: 1.2, min_elevation: 0.25, is_boardwalk: 1, is_submerged: 0 },
  { id: 'E3', source_id: 'NODE_BOARDWALK_J1', target_id: 'NODE_BOARDWALK_J2', distance_meters: 35, width_meters: 1.2, min_elevation: 0.20, is_boardwalk: 1, is_submerged: 0 },
  { id: 'E4', source_id: 'NODE_BOARDWALK_J2', target_id: 'NODE_ALLEY_EAST', distance_meters: 26, width_meters: 1.5, min_elevation: 0.09, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E5', source_id: 'NODE_ALLEY_EAST', target_id: 'NODE_COMMUNITY_CENTER', distance_meters: 36, width_meters: 2.0, min_elevation: 0.20, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E6', source_id: 'NODE_COMMUNITY_CENTER', target_id: 'NODE_TEMPLE_FORECOURT', distance_meters: 34, width_meters: 3.5, min_elevation: 0.45, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E7', source_id: 'NODE_TEMPLE_FORECOURT', target_id: 'NODE_MEDICAL_POINT_B', distance_meters: 35, width_meters: 4.0, min_elevation: 0.65, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E8', source_id: 'NODE_ALLEY_NORTH', target_id: 'NODE_TEMPLE_FORECOURT', distance_meters: 118, width_meters: 2.2, min_elevation: 0.30, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E9', source_id: 'NODE_HOUSE_A012', target_id: 'NODE_PIER_WATER', distance_meters: 98, width_meters: 1.4, min_elevation: 0.05, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E10', source_id: 'NODE_COMMUNITY_CENTER', target_id: 'NODE_SHELTER_TEMPLE', distance_meters: 50, width_meters: 3.0, min_elevation: 0.45, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E11', source_id: 'NODE_SHELTER_TEMPLE', target_id: 'NODE_MEDICAL_POINT_B', distance_meters: 45, width_meters: 3.5, min_elevation: 0.70, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E12', source_id: 'NODE_BOARDWALK_J2', target_id: 'NODE_COMMUNITY_CENTER', distance_meters: 28, width_meters: 1.2, min_elevation: 0.25, is_boardwalk: 1, is_submerged: 0 },
  { id: 'E13', source_id: 'NODE_ALLEY_NORTH', target_id: 'NODE_COMMUNITY_CENTER', distance_meters: 72, width_meters: 2.0, min_elevation: 0.28, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E14', source_id: 'NODE_ALLEY_EAST', target_id: 'NODE_TEMPLE_FORECOURT', distance_meters: 65, width_meters: 2.0, min_elevation: 0.35, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E15', source_id: 'NODE_PIER_WATER', target_id: 'NODE_BOARDWALK_J1', distance_meters: 75, width_meters: 1.2, min_elevation: 0.15, is_boardwalk: 0, is_submerged: 0 },
  { id: 'E16', source_id: 'NODE_PIER_WATER', target_id: 'NODE_SHELTER_TEMPLE', distance_meters: 88, width_meters: 2.0, min_elevation: 0.20, is_boardwalk: 0, is_submerged: 0 },
];

function getBaselineChecklist() {
  return [
    { id: 'p1', category: 'people', title: 'เคาะประตูบ้าน A-012 (ยายสมจิตร - ติดเตียง)', is_done: 1, completed_at: '20:05', completed_by: 'ทีมชุมชน 01' },
    { id: 'p2', category: 'people', title: 'แจ้งเตือน 3 ครัวเรือนไม่มีสมาร์ตโฟน (A-002, A-007, A-014)', is_done: 0, completed_at: null, completed_by: null },
    { id: 'a1', category: 'area', title: 'ตรวจสอบสะพานไม้ยกสูงทางแยก 2 (ระดับน้ำ +0.25 ม.)', is_done: 1, completed_at: '20:08', completed_by: 'ทีมช่างชุมชน' },
    { id: 'r1', category: 'resource', title: 'จัดเตรียมเปลสนาม & ถังออกซิเจนสำรอง 1 ถัง ณ ศูนย์ชุมชน', is_done: 1, completed_at: '20:12', completed_by: 'Community Team 02' },
    { id: 'pl1', category: 'plan', title: 'ประสานงานจุดส่งต่อรถพยาบาล EMS วชิรพยาบาล ณ Medical Point B', is_done: 0, completed_at: null, completed_by: null },
  ];
}

const RESIDENTS = [
  { id: 'res-12', household_code: 'A-012', name: 'นางสมจิตร รัตนประสิทธิ์', age: 82, is_bedridden: 1, requires_oxygen: 1, oxygen_reserve_mins: 90, mobility_constraint: 'ติดเตียง เคลื่อนย้ายด้วยเปลสนามเท่านั้น' },
  { id: 'res-12-carer', household_code: 'A-012', name: 'นางกรรณิการ์ รัตนประสิทธิ์ (บุตรสาว)', age: 56, is_bedridden: 0, requires_oxygen: 0, oxygen_reserve_mins: 0, mobility_constraint: 'ผู้ดูแลหลัก' },
  { id: 'res-01', household_code: 'A-001', name: 'นายประเสริฐ สุขสวัสดิ์', age: 68, is_bedridden: 0, requires_oxygen: 0, oxygen_reserve_mins: 0, mobility_constraint: 'เดินช้า' },
  { id: 'res-02', household_code: 'A-002', name: 'นางทองย้อย พุ่มพวง', age: 75, is_bedridden: 0, requires_oxygen: 0, oxygen_reserve_mins: 0, mobility_constraint: 'ผู้สูงอายุ ไม่มีมือถือ' },
  { id: 'res-08', household_code: 'A-008', name: 'นายสมาน อินทรชัย', age: 71, is_bedridden: 0, requires_oxygen: 0, oxygen_reserve_mins: 0, mobility_constraint: 'โรคเกาต์' },
];

function getBaselineIncidents() {
  return [
    { id: 'inc-001', code: 'INC-2024-001', category: 'BEDRIDDEN_PATIENT', severity: 'critical', status: 'responding', reported_at: '20:20', location_name: 'บ้าน A-012 หลังตลาดเก่า', target_household: 'A-012', description: 'ผู้ป่วยติดเตียง ออกซิเจนเหลือ 90 นาที น้ำท่วมซอย 35 ซม.', current_water_depth_cm: 35, recommended_plan_id: 'PLAN_B', approved_plan_id: 'PLAN_B' },
    { id: 'inc-002', code: 'INC-2024-002', category: 'DRAINAGE_BOTTLENECK', severity: 'high', status: 'open', reported_at: '20:15', location_name: 'ตรอกสะพานไม้ทางแยก 2', target_household: null, description: 'มีเศษกิ่งไม้และขยะติดคอขวดสะพานไม้ น้ำเริ่มเอ่อล้นแผ่นไม้กระดาน', current_water_depth_cm: 28, recommended_plan_id: null, approved_plan_id: null },
    { id: 'inc-003', code: 'INC-2024-003', category: 'NO_PHONE_HOUSEHOLD', severity: 'medium', status: 'in_progress', reported_at: '20:05', location_name: 'บ้าน A-002, A-007, A-014', target_household: 'A-002', description: 'ส่งทีมเคาะประตูแจ้งเตือน 3 หลังคาเรือนที่ไม่มีสมาร์ตโฟน', current_water_depth_cm: 15, recommended_plan_id: null, approved_plan_id: null },
    { id: 'inc-004', code: 'INC-2024-004', category: 'SHELTER_CAPACITY', severity: 'watch', status: 'open', reported_at: '20:00', location_name: 'ศาลาการเปรียญ Shelter A', target_household: null, description: 'ความจุรับได้ 100 คน ปัจจุบันมีผู้เข้าพักแล้ว 82 คน คงเหลือ 18 ที่นั่ง', current_water_depth_cm: 0, recommended_plan_id: null, approved_plan_id: null },
  ];
}

// --- STATE MANAGEMENT ---

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


let currentStepIndex = 0;
let currentDisasterMode = "flood";
let boardwalkSubmerged = false;
let isPlanApproved = false;
let activeTask: any = null;
let liveHouseholds = getBaselineHouseholds();
let liveChecklist = getBaselineChecklist();
let liveIncidents = getBaselineIncidents();
let liveTasks: any[] = [
  {
    id: 'task-a012',
    code: 'TASK #A-012',
    incident_id: 'inc-001',
    priority: 'critical',
    title: 'เคลื่อนย้ายผู้ป่วยติดเตียงบ้าน A-012 (ยายสมจิตร)',
    mission_objective: 'ใช้เปลสนามเดินเท้าบนสะพานไม้ยกสูง นำผู้ป่วยและถังออกซิเจนสำรองมายังจุดส่งต่อการแพทย์ Medical Point B',
    target_household: 'A-012',
    assigned_team: 'Community Team 02',
    destination_point: 'จุดส่งต่อการแพทย์ B (หน้าวัดเทวราชกุญชร)',
    status: 'accepted',
    created_at: '20:23',
    accepted_at: '20:24',
    arrived_at: null,
    completed_at: null,
  }
];

// --- HYDROLOGY & PATHFINDING ---

function calculateRiverWaterLevel(elapsedMinutes: number) {
  const tHours = elapsedMinutes / 60;
  const level = 0.42 + 0.32 * tHours - 0.02 * (tHours * tHours);
  const rateOfRise = Math.max(0.1, 0.32 - 0.04 * tHours);
  const rainfall = elapsedMinutes >= 15 && elapsedMinutes <= 35 ? 55.0 : 35.0;
  return {
    level: Number(level.toFixed(3)),
    rateOfRise: Number(rateOfRise.toFixed(2)),
    rainfall,
  };
}

function calculateWaterDepthCm(waterLevelMeters: number, elevationMeters: number): number {
  const depthMeters = Math.max(0, waterLevelMeters - elevationMeters);
  return Math.round(depthMeters * 100);
}

function findShortestPath(
  startNodeId: string,
  targetNodeId: string,
  currentWaterLevelMeters: number,
  mode: 'pedestrian' | 'stretcher' | 'ambulance' = 'stretcher',
  submergedSet: Set<string> = new Set()
) {
  const nodeMap = new Map(WALKWAY_NODES.map((n) => [n.id, n]));
  const adj = new Map<string, Array<{ target: string; weight: number; edge: any }>>();
  for (const n of WALKWAY_NODES) adj.set(n.id, []);

  for (const e of WALKWAY_EDGES) {
    const depthCm = calculateWaterDepthCm(currentWaterLevelMeters, e.min_elevation);
    const isEdgeSubmerged = submergedSet.has(e.id) || submergedSet.has(e.source_id) || submergedSet.has(e.target_id);

    let passable = true;
    let weight = e.distance_meters;

    if (mode === 'stretcher') {
      if (isEdgeSubmerged || depthCm > 35) passable = false;
      else weight *= (1 + depthCm / 15);
    } else if (mode === 'ambulance') {
      if (e.width_meters < 3.0 || depthCm > 25) passable = false;
    }

    if (passable) {
      adj.get(e.source_id)?.push({ target: e.target_id, weight, edge: e });
      adj.get(e.target_id)?.push({ target: e.source_id, weight, edge: e });
    }
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  for (const n of WALKWAY_NODES) dist.set(n.id, Infinity);
  dist.set(startNodeId, 0);

  const unvisited = new Set(WALKWAY_NODES.map((n) => n.id));

  while (unvisited.size > 0) {
    let curr: string | null = null;
    let minDist = Infinity;
    for (const u of unvisited) {
      const d = dist.get(u) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        curr = u;
      }
    }

    if (!curr || minDist === Infinity || curr === targetNodeId) break;
    unvisited.delete(curr);

    for (const neighbor of adj.get(curr) || []) {
      if (!unvisited.has(neighbor.target)) continue;
      const alt = (dist.get(curr) ?? 0) + neighbor.weight;
      if (alt < (dist.get(neighbor.target) ?? Infinity)) {
        dist.set(neighbor.target, alt);
        prev.set(neighbor.target, curr);
      }
    }
  }

  const path: string[] = [];
  let u: string | undefined = targetNodeId;
  while (u) {
    path.unshift(u);
    u = prev.get(u);
  }

  if (path[0] !== startNodeId) {
    return {
      pathNodeIds: [],
      pathNodeNames: [],
      totalDistanceMeters: 0,
      estimatedMinutes: 0,
      passable: false,
      blockageReason: 'ไม่มีเส้นทางที่ปลอดภัยผ่านระดับน้ำท่วมปัจจุบัน',
      waypoints3D: [],
    };
  }

  let totalDist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = WALKWAY_EDGES.find(
      (edge) => (edge.source_id === path[i] && edge.target_id === path[i + 1]) ||
                (edge.target_id === path[i] && edge.source_id === path[i + 1])
    );
    if (e) totalDist += e.distance_meters;
  }

  return {
    pathNodeIds: path,
    pathNodeNames: path.map((id) => nodeMap.get(id)?.name || id),
    totalDistanceMeters: totalDist,
    estimatedMinutes: Math.round(totalDist / 25), // ~1.5 km/h stretcher speed
    passable: true,
    waypoints3D: path.map((id) => {
      const n = nodeMap.get(id)!;
      return { x: n.x, y: n.elevation, z: n.y };
    }),
  };
}

function evaluateAllPlans(waterLevel: number, submergedSet: Set<string>) {
  const planBRoute = findShortestPath('NODE_HOUSE_A012', 'NODE_MEDICAL_POINT_B', waterLevel, 'stretcher', submergedSet);
  const isReplanned = submergedSet.has('NODE_BOARDWALK_J2') || submergedSet.has('E2') || submergedSet.has('E3');

  return [
    {
      id: 'PLAN_A',
      title: 'Plan A: รถพยาบาลเข้าตรง (Direct Ambulance)',
      feasibilityScore: 15,
      status: 'rejected',
      reasoningTh: 'ตรอกซอยหน้าบ้านกว้างเพียง 1.4 ม. (รถพยาบาลต้องการ 3.0 ม.) และระดับน้ำท่วม 35 ซม. เกินท่อไอเสีย',
      riskFactors: ['Alley Width Bottleneck', 'Tailpipe Submersion Risk'],
      recommended: false,
    },
    {
      id: 'PLAN_B',
      title: 'Plan B: ชุมชนผลัดเปลี่ยนส่งต่อ (Community Stretcher Relay)',
      feasibilityScore: 92,
      status: 'recommended',
      reasoningTh: isReplanned
        ? '⚠️ ปรับใช้เส้นทางเลี่ยงยกระดับ: ผ่านหน้าศูนย์ชุมชนวัดเทวราชกุญชร (171 ม.) หลังสะพานไม้เดิมจมน้ำ'
        : 'เส้นทางแนะนำ: ทีมชุมชนใช้เปลสนามเดินบนสะพานไม้ยกสูง ไปยังจุด Medical Point B (135 ม., 5 นาที)',
      recommended: true,
      route: planBRoute,
      isDynamicReplanned: isReplanned,
    },
    {
      id: 'PLAN_C',
      title: 'Plan C: เคลื่อนย้ายทางเรือริมตลิ่ง (River Boat Evacuation)',
      feasibilityScore: 38,
      status: 'rejected',
      reasoningTh: 'กระแสน้ำเชี่ยว 2.1 ม./วินาที คลื่นซัดจากเรือด่วน และระดับน้ำเหนือตลิ่งทำให้เทียบท่าไม่ปลอดภัย',
      riskFactors: ['High River Velocity', 'Wave Surges', 'Lack of Oxygen Bracket on Boat'],
      recommended: false,
    },
  ];
}

function explainRiskAssessment(data: any) {
  const factors: string[] = [];
  if (data.waterLevelMeters >= 0.7) factors.push(`ระดับน้ำแม่น้ำเจ้าพระยาสูงถึง ${data.waterLevelMeters} ม. เหนือตลิ่งลุ่มต่ำ`);
  if (data.rateOfRisePerHour >= 0.25) factors.push(`อัตราการเพิ่มของระดับน้ำสูงผิดปกติ (+${data.rateOfRisePerHour} ม./ชม.) จากอิทธิพลน้ำทะเลหนุน`);
  if (data.rainfallMm >= 40) factors.push(`ปริมาณฝนสะสม ${data.rainfallMm} มม./ชม. ทำให้การระบายน้ำลงคลองเป็นไปได้ช้า`);
  if (data.alleyElevation <= 0.1) factors.push(`ระดับความสูงหน้าบ้านต่ำเพียง ${data.alleyElevation} ม. (เป็นแอ่งคอขวดรับน้ำ)`);
  if (data.bedridden) factors.push('มีผู้ป่วยติดเตียงที่ไม่สามารถเคลื่อนย้ายได้ด้วยตนเอง');
  if (data.requiresOxygen && data.oxygenReserveMins > 0) factors.push(`ขีดจำกัดเวลาวิกฤต: ออกซิเจนสำรองเหลือประมาณ ${data.oxygenReserveMins} นาที`);
  if (data.digitalAccess === 'no_phone_offline') factors.push('ครัวเรือนไม่มีสมาร์ตโฟน/ช่องทางออนไลน์ ต้องใช้การตรวจทางกายภาพและเสียงตามสาย');
  if (data.isBoardwalkSubmerged) factors.push('สะพานไม้ยกสูงชั่วคราวถูกน้ำท่วมขัง ตัดขาดเส้นทางสัญจรหลัก');

  return {
    headlineTh: 'วิกฤตเร่งด่วน: ต้องการการเคลื่อนย้ายผ่านเส้นทาง Community Relay ทันที',
    factorsTh: factors,
    recommendationTh: 'แนะนำให้ผู้บัญชาการอนุมัติ Plan B สั่งการ Community Team 02 เคลื่อนย้ายทันที',
  };
}

function parseCitizenVoiceReport(text: string) {
  let category = 'GENERAL_REPORT';
  let severity = 'medium';
  let parsedLocation = 'ในชุมชนวัดเทวราชกุญชร';

  if (text.includes('ติดเตียง') || text.includes('ออกซิเจน') || text.includes('ยาย')) {
    category = 'BEDRIDDEN_PATIENT';
    severity = 'critical';
  } else if (text.includes('สะพาน') || text.includes('จม') || text.includes('คอขวด') || text.includes('ระบาย')) {
    category = 'DRAINAGE_BOTTLENECK';
    severity = 'high';
  } else if (text.includes('ไม่มีมือถือ') || text.includes('โทรศัพท์')) {
    category = 'NO_PHONE_HOUSEHOLD';
    severity = 'medium';
  }

  const match = text.match(/([A-D]-\d{2,3})/i);
  if (match) parsedLocation = `บ้าน ${match[1].toUpperCase()}`;

  return { category, severity, parsedLocation };
}

function getSystemState(stepOverride?: number) {
  const effectiveIndex = typeof stepOverride === 'number' ? stepOverride : currentStepIndex;
  const step = TIMELINE_STEPS[effectiveIndex];
  const hydro = calculateRiverWaterLevel(step.minutes);

  const isSubmerged = boardwalkSubmerged || step.time >= '20:30';
  const submergedSet = new Set<string>();
  if (isSubmerged) {
    submergedSet.add('NODE_BOARDWALK_J2');
    submergedSet.add('E2');
    submergedSet.add('E3');
  }

  // Sync house statuses
  if (step.time >= '20:20') {
    const a12 = liveHouseholds.find((h) => h.code === 'A-012');
    if (a12) {
      a12.access_status = 'critical_help_needed';
      a12.area_risk = 'critical';
    }
  }

  const plans = evaluateAllPlans(hydro.level, submergedSet);
  const bestPlan = plans.find((p) => p.recommended) || plans[1];

  const households = liveHouseholds.map((h) => {
    const depthCm = calculateWaterDepthCm(hydro.level, h.alley_elevation);
    const residentsForHouse = RESIDENTS.filter((r) => r.household_code === h.code);
    return {
      ...h,
      current_water_depth_cm: depthCm,
      residents: residentsForHouse,
    };
  });

  const aiExplanation = explainRiskAssessment({
    houseCode: 'A-012',
    waterLevelMeters: hydro.level,
    rateOfRisePerHour: hydro.rateOfRise,
    rainfallMm: hydro.rainfall,
    alleyElevation: 0.05,
    bedridden: true,
    requiresOxygen: true,
    oxygenReserveMins: Math.max(0, 90 - step.minutes),
    digitalAccess: 'no_phone_offline',
    isBoardwalkSubmerged: isSubmerged,
  });

  return {
    disasterMode: currentDisasterMode,
    disasterData: getDisasterData(currentDisasterMode, step),
    timeline: {
      currentIndex: effectiveIndex,
      currentStep: step,
      steps: TIMELINE_STEPS,
    },
    hydrology: {
      currentTime: step.time,
      waterLevelMeters: hydro.level,
      rateOfRisePerHour: hydro.rateOfRise,
      rainfallMmPerHour: hydro.rainfall,
      forecastLevel2200: 1.00,
      preparationRemainingMinutes: Math.max(0, 120 - step.minutes),
      alleyDepthA012Cm: Math.max(0, Math.round((hydro.level - 0.15) * 100)),
    },
    routing: {
      plans,
      bestPlan,
      isBoardwalkSubmerged: isSubmerged,
      isReplanned: isSubmerged,
      activePlanApproved: isPlanApproved || step.time >= '20:23',
    },
    activeTask: activeTask || (isPlanApproved || step.time >= '20:23' ? liveTasks[0] : null),
    households,
    checklist: liveChecklist,
    residents: RESIDENTS,
    incidents: liveIncidents,
    tasks: liveTasks,
    aiExplanation,
  };
}

// --- VERCEL SERVERLESS HANDLER ---

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Robust path resolution across rewrites, query parameters, and direct invocations
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const paramPath = (req.query && req.query.path) || urlObj.searchParams.get('path');
  const headerPath = req.headers && (req.headers['x-matched-path'] || req.headers['x-now-route-matches']);

  let targetPath = '';
  if (paramPath) {
    targetPath = `/api/${paramPath}`;
  } else if (headerPath) {
    targetPath = new URL(headerPath, 'http://localhost').pathname;
  } else {
    targetPath = urlObj.pathname;
  }
  const urlPath = targetPath.toLowerCase();

  // Robust body parsing (handles streams, strings, and pre-parsed JSON)
  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  } else if (!body && (req.method === 'POST' || req.method === 'PUT')) {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const raw = Buffer.concat(buffers).toString();
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const json = (data: any, status = 200) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data, null, 2));
  };

  try {
    // 1. Health
    if (urlPath === '/api/health' || urlPath.endsWith('/health')) {
      return json({ status: 'ok', engine: 'Vercel Serverless (Node.js/TS)', time: new Date().toISOString() });
    }

    // 2. State
    if (urlPath === '/api/state' || urlPath.endsWith('/state')) {
      return json(getSystemState());
    }

    // 3. Step
    if (urlPath === '/api/step' || urlPath.endsWith('/step')) {
      const body = req.body || {};
      const newIndex = typeof body.stepIndex === 'number' ? body.stepIndex : currentStepIndex + 1;
      if (newIndex >= 0 && newIndex < TIMELINE_STEPS.length) {
        currentStepIndex = newIndex;
        boardwalkSubmerged = TIMELINE_STEPS[currentStepIndex].time >= '20:30';
        if (TIMELINE_STEPS[currentStepIndex].time < '20:23') {
          isPlanApproved = false;
        }
        return json(getSystemState());
      }
      return json({ error: 'Invalid step index' }, 400);
    }

    // 4. Approve Plan B
    if (urlPath === '/api/approve-plan' || urlPath.endsWith('/approve-plan')) {
      isPlanApproved = true;
      liveTasks[0].status = 'accepted';
      activeTask = liveTasks[0];
      return json({ success: true, task: activeTask, state: getSystemState() });
    }

    // 5. Reset Plan
    if (urlPath === '/api/plan/reset' || urlPath.endsWith('/plan/reset')) {
      isPlanApproved = false;
      activeTask = null;
      return json({ success: true, state: getSystemState() });
    }

    // 6. Checklist Toggle
    if (urlPath === '/api/checklist/toggle' || urlPath.endsWith('/checklist/toggle')) {
      const body = req.body || {};
      const { id } = body;
      const item = liveChecklist.find((c) => c.id === id);
      if (item) {
        item.is_done = item.is_done ? 0 : 1;
        item.completed_at = item.is_done ? TIMELINE_STEPS[currentStepIndex].time : null;
        item.completed_by = item.is_done ? 'จนท. ประชาอารักษ์' : null;
        return json({ success: true, item, state: getSystemState() });
      }
      return json({ error: 'Checklist item not found' }, 404);
    }

    // 7. Household Status
    if (urlPath === '/api/household/status' || urlPath.endsWith('/household/status')) {
      const body = req.body || {};
      const { code, access_status, area_risk } = body;
      const house = liveHouseholds.find((h) => h.code === code);
      if (house) {
        if (access_status) house.access_status = access_status;
        if (area_risk) house.area_risk = area_risk;
        return json({ success: true, house, state: getSystemState() });
      }
      return json({ error: 'Household not found' }, 404);
    }

    // 8. Household Dispatch
    if (urlPath === '/api/household/dispatch' || urlPath.endsWith('/household/dispatch')) {
      const body = req.body || {};
      const { code, team = 'Community Team 01', reason = 'เคาะประตูสำรวจความปลอดภัยและส่งสิ่งของจำเป็น' } = body;
      const taskCode = `TASK #DOOR-${code}`;
      const newTask = {
        id: `task-door-${Date.now()}`,
        code: taskCode,
        incident_id: 'inc-001',
        priority: 'medium',
        title: `ทีมสำรวจเคาะประตูบ้าน ${code}`,
        mission_objective: reason,
        target_household: code,
        assigned_team: team,
        destination_point: `บ้าน ${code}`,
        status: 'accepted',
        created_at: TIMELINE_STEPS[currentStepIndex].time,
        accepted_at: TIMELINE_STEPS[currentStepIndex].time,
      };
      liveTasks.unshift(newTask);
      return json({ success: true, taskCode, state: getSystemState() });
    }

    // 9. Task Status
    if (urlPath === '/api/task/status' || urlPath.endsWith('/task/status')) {
      const body = req.body || {};
      const { code = 'TASK #A-012', status: newStatus } = body;
      const task = liveTasks.find((t) => t.code === code);
      if (task) {
        task.status = newStatus;
        if (newStatus === 'arrived') task.arrived_at = TIMELINE_STEPS[currentStepIndex].time;
        if (newStatus === 'completed') task.completed_at = TIMELINE_STEPS[currentStepIndex].time;
        activeTask = task;
        return json({ success: true, task, state: getSystemState() });
      }
      return json({ error: 'Task not found' }, 404);
    }

    // 10. Field Report
    if (urlPath === '/api/field-report' || urlPath.endsWith('/field-report')) {
      const body = req.body || {};
      const { waterDepthCm = 45, bridgeCondition = 'submerged', note = '' } = body;
      boardwalkSubmerged = bridgeCondition === 'submerged' || waterDepthCm >= 40;
      if (currentStepIndex < 6) currentStepIndex = 6; // 20:30
      if (activeTask) activeTask.status = 'reported';
      return json({ success: true, dynamicReplanning: boardwalkSubmerged, state: getSystemState() });
    }

    // 11. Reset Demo
    if (urlPath === '/api/reset-demo' || urlPath.endsWith('/reset-demo')) {
      currentStepIndex = 0;
      boardwalkSubmerged = false;
      isPlanApproved = false;
      activeTask = null;
      liveHouseholds = getBaselineHouseholds();
      liveChecklist = getBaselineChecklist();
      liveIncidents = getBaselineIncidents();
      liveTasks = [
        {
          id: 'task-a012',
          code: 'TASK #A-012',
          incident_id: 'inc-001',
          priority: 'critical',
          title: 'เคลื่อนย้ายผู้ป่วยติดเตียงบ้าน A-012 (ยายสมจิตร)',
          mission_objective: 'ใช้เปลสนามเดินเท้าบนสะพานไม้ยกสูง นำผู้ป่วยและถังออกซิเจนสำรองมายังจุดส่งต่อการแพทย์ Medical Point B',
          target_household: 'A-012',
          assigned_team: 'Community Team 02',
          destination_point: 'จุดส่งต่อการแพทย์ B (หน้าวัดเทวราชกุญชร)',
          status: 'accepted',
          created_at: '20:23',
          accepted_at: '20:24',
          arrived_at: null,
          completed_at: null,
        }
      ];
      return json({ success: true, message: 'Reset to 20:00 baseline', state: getSystemState() });
    }

    // 12. Voice SOS
    if (urlPath === '/api/voice-sos' || urlPath.endsWith('/voice-sos')) {
      const body = req.body || {};
      const { text = '' } = body;
      const parsed = parseCitizenVoiceReport(text);
      const incCode = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
      const newInc = {
        id: `inc-${Date.now()}`,
        code: incCode,
        category: parsed.category,
        severity: parsed.severity,
        status: 'open',
        reported_at: TIMELINE_STEPS[currentStepIndex].time,
        location_name: parsed.parsedLocation,
        target_household: null,
        description: text,
        current_water_depth_cm: 30,
        recommended_plan_id: null,
        approved_plan_id: null,
      };
      liveIncidents.unshift(newInc);
      return json({ success: true, parsed, incCode, state: getSystemState() });
    }

    
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

    // Default fallback
    return json({ error: 'Endpoint not found', path: urlPath }, 404);
  } catch (err: any) {
    return json({ error: err?.message || 'Serverless execution error' }, 500);
  }
}
