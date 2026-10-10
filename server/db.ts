/**
 * Real SQLite Database Engine using bun:sqlite
 * Stores all community data, walkway graph, incidents, tasks, and telemetry
 * Stored on External SSD: /Volumes/MAC/Thai_Community/community_shield.sqlite
 */

import { Database } from 'bun:sqlite';
import path from 'path';

const DB_PATH = path.resolve('/Volumes/MAC/Thai_Community/community_shield.sqlite');
export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency and zero disk corruption
db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Households table
  db.run(`
    CREATE TABLE IF NOT EXISTS households (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      address TEXT NOT NULL,
      zone TEXT NOT NULL,
      coord_x REAL NOT NULL,
      coord_y REAL NOT NULL,
      coord_z REAL NOT NULL,
      house_type TEXT NOT NULL,
      floor_elevation REAL NOT NULL,
      alley_elevation REAL NOT NULL,
      digital_access TEXT NOT NULL,
      area_risk TEXT NOT NULL,
      access_status TEXT NOT NULL,
      special_notes TEXT
    );
  `);

  // 2. Residents table
  db.run(`
    CREATE TABLE IF NOT EXISTS residents (
      id TEXT PRIMARY KEY,
      household_code TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      is_bedridden INTEGER DEFAULT 0,
      has_chronic_illness INTEGER DEFAULT 0,
      requires_oxygen INTEGER DEFAULT 0,
      oxygen_reserve_mins INTEGER DEFAULT 0,
      mobility_constraint TEXT,
      FOREIGN KEY (household_code) REFERENCES households(code)
    );
  `);

  // 3. Walkway Network Nodes (Real GIS coordinate graph of Wat Thewarat Kunchorn)
  db.run(`
    CREATE TABLE IF NOT EXISTS walkway_nodes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      elevation REAL NOT NULL,
      node_type TEXT NOT NULL -- 'house', 'junction', 'boardwalk', 'medical_point', 'shelter', 'bridge'
    );
  `);

  // 4. Walkway Network Edges (Connections between nodes with width & flood constraints)
  db.run(`
    CREATE TABLE IF NOT EXISTS walkway_edges (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      distance_meters REAL NOT NULL,
      width_meters REAL NOT NULL,
      min_elevation REAL NOT NULL,
      is_boardwalk INTEGER DEFAULT 0,
      is_submerged INTEGER DEFAULT 0,
      max_flood_depth_cm REAL DEFAULT 0,
      FOREIGN KEY (source_id) REFERENCES walkway_nodes(id),
      FOREIGN KEY (target_id) REFERENCES walkway_nodes(id)
    );
  `);

  // 5. Sensors & Hydrological Log
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp_time TEXT NOT NULL,
      water_level REAL NOT NULL,
      rate_of_rise REAL NOT NULL,
      rainfall_mm REAL NOT NULL,
      is_forecast INTEGER DEFAULT 0
    );
  `);

  // 6. Incidents table
  db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      reported_at TEXT NOT NULL,
      location_name TEXT NOT NULL,
      target_household TEXT,
      description TEXT NOT NULL,
      current_water_depth_cm REAL NOT NULL,
      recommended_plan_id TEXT,
      approved_plan_id TEXT
    );
  `);

  // 7. Response Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      incident_id TEXT NOT NULL,
      priority TEXT NOT NULL,
      title TEXT NOT NULL,
      mission_objective TEXT NOT NULL,
      target_household TEXT NOT NULL,
      assigned_team TEXT NOT NULL,
      destination_point TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      accepted_at TEXT,
      arrived_at TEXT,
      completed_at TEXT
    );
  `);

  // 8. Field Reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS field_reports (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      team_code TEXT NOT NULL,
      actual_water_depth_cm REAL NOT NULL,
      alley_passable INTEGER DEFAULT 1,
      boardwalk_safe INTEGER DEFAULT 1,
      patient_condition TEXT,
      gps_lat REAL,
      gps_lng REAL,
      triggers_replanning INTEGER DEFAULT 0,
      replanning_reason TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
  `);

  // 9. Checklist Items table
  db.run(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      is_done INTEGER DEFAULT 0,
      completed_at TEXT,
      completed_by TEXT
    );
  `);

  // 10. Nurse Notes & Medical Triage table
  db.run(`
    CREATE TABLE IF NOT EXISTS nurse_notes (
      id TEXT PRIMARY KEY,
      household_code TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      triage_level TEXT NOT NULL,
      spo2 REAL,
      pulse INTEGER,
      blood_pressure TEXT,
      oxygen_flow_lpm REAL,
      oxygen_reserve_mins INTEGER,
      triage_notes TEXT NOT NULL,
      transfer_target TEXT DEFAULT 'โรงพยาบาลวชิรพยาบาล',
      transfer_status TEXT DEFAULT 'pending',
      recorded_by TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );
  `);

  // 11. LINE Broadcast & Alert Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS line_broadcasts (
      id TEXT PRIMARY KEY,
      sent_at TEXT NOT NULL,
      hazard_type TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      recipients_count INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      delivery_receipt TEXT
    );
  `);

  // Seed Data if households table is empty
  const count = db.query('SELECT COUNT(*) as cnt FROM households').get() as { cnt: number };
  if (count.cnt === 0) {
    seedDatabase();
  }

  // Ensure checklist_items are seeded
  const checkCount = db.query('SELECT COUNT(*) as cnt FROM checklist_items').get() as { cnt: number };
  if (checkCount.cnt === 0) {
    seedChecklist();
  }

  // Ensure nurse_notes are seeded
  const nurseCount = db.query('SELECT COUNT(*) as cnt FROM nurse_notes').get() as { cnt: number };
  if (nurseCount.cnt === 0) {
    seedNurseNotes();
  }

  // Ensure line_broadcasts are seeded
  const lineCount = db.query('SELECT COUNT(*) as cnt FROM line_broadcasts').get() as { cnt: number };
  if (lineCount.cnt === 0) {
    seedLineBroadcasts();
  }
}

function seedLineBroadcasts() {
  const insert = db.prepare(`
    INSERT INTO line_broadcasts (id, sent_at, hazard_type, target_audience, title, message, recipients_count, status, delivery_receipt)
    VALUES ($id, $sent_at, $hazard_type, $target_audience, $title, $message, $recipients_count, $status, $delivery_receipt);
  `);
  insert.run({
    $id: 'lb-001',
    $sent_at: '20:10',
    $hazard_type: 'flood',
    $target_audience: 'all_community',
    $title: 'แจ้งเตือนระดับน้ำเฝ้าระวัง +0.72 ม. (เตือนภัยชุมชนวัดเทวราชกุญชร)',
    $message: 'ระดับน้ำแม่น้ำเจ้าพระยาเริ่มเอ่อล้นตลิ่ง คาดแตะวิกฤต 1.00 ม. เวลา 22:00 น. ขอให้ทุกครัวเรือนยกของขึ้นที่สูงทันที',
    $recipients_count: 248,
    $status: 'sent',
    $delivery_receipt: 'LINE_BC_20261010_01'
  });
  insert.run({
    $id: 'lb-002',
    $sent_at: '20:24',
    $hazard_type: 'flood',
    $target_audience: 'field_teams',
    $title: 'มอบหมายภารกิจกู้ชีพเร่งด่วน: TASK #A-012',
    $message: 'มอบหมายทีม Community Team 02 เคลื่อนย้ายผู้ป่วยติดเตียงบ้าน A-012 (ยายสมจิตร) ผ่านสะพานไม้ยกสูงไปยังจุดส่งต่อการแพทย์ B',
    $recipients_count: 14,
    $status: 'sent',
    $delivery_receipt: 'LINE_MSG_TASK_A012'
  });
}

function seedDatabase() {
  console.log('[DB] Seeding real community data into SQLite...');

  // Seed 16 Households
  const insertHouse = db.prepare(`
    INSERT INTO households (
      id, code, title, address, zone, coord_x, coord_y, coord_z,
      house_type, floor_elevation, alley_elevation, digital_access,
      area_risk, access_status, special_notes
    ) VALUES (
      $id, $code, $title, $address, $zone, $coord_x, $coord_y, $coord_z,
      $house_type, $floor_elevation, $alley_elevation, $digital_access,
      $area_risk, $access_status, $special_notes
    );
  `);

  const houses = [
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
    
    // KILLER DEMO: House A-012
    { id: 'h-12', code: 'A-012', title: 'บ้านยายสมจิตร (ผู้ป่วยติดเตียง)', address: '32/1 ซอยวัดเทวราชกุญชร (หลังตลาดเก่า)', zone: 'Zone C', coord_x: -7, coord_y: 80, coord_z: 0, house_type: 'House_Type_C_Two_Storey', floor_elevation: 0.55, alley_elevation: 0.05, digital_access: 'no_phone_offline', area_risk: 'critical', access_status: 'critical_help_needed', special_notes: 'ผู้ป่วยติดเตียง ออกซิเจนสำรองเหลือ 90 นาที น้ำท่วมซอยหน้าบ้าน 35 ซม.' },
    
    { id: 'h-13', code: 'A-013', title: 'บ้านปั้นหยาซอยเหนือตะวันออก', address: '34 ซอยวัดเทวราชกุญชร', zone: 'Zone D', coord_x: 22, coord_y: 80, coord_z: 0, house_type: 'House_Type_B_Hip', floor_elevation: 0.55, alley_elevation: 0.20, digital_access: 'online', area_risk: 'normal', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-14', code: 'A-014', title: 'บ้านไม้ใต้ถุนสูงฝั่งใต้', address: '36 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -77, coord_y: -58, coord_z: 0, house_type: 'House_Type_D_Raised_Timber', floor_elevation: 1.65, alley_elevation: 0.14, digital_access: 'phone_only', area_risk: 'watch', access_status: 'confirmed_safe', special_notes: '' },
    { id: 'h-15', code: 'A-015', title: 'บ้านจั่วฝั่งใต้กลาง', address: '38 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -53, coord_y: -58, coord_z: 0, house_type: 'House_Type_A_Gable', floor_elevation: 0.55, alley_elevation: 0.12, digital_access: 'online', area_risk: 'watch', access_status: 'followup_needed', special_notes: '' },
    { id: 'h-16', code: 'A-016', title: 'บ้านสองชั้นหัวมุมใต้', address: '40 ซอยวัดเทวราชกุญชร', zone: 'Zone B', coord_x: -26, coord_y: -60, coord_z: 0, house_type: 'House_Type_C_Two_Storey', floor_elevation: 0.55, alley_elevation: 0.15, digital_access: 'online', area_risk: 'normal', access_status: 'confirmed_safe', special_notes: '' },
  ];

  for (const h of houses) {
    insertHouse.run({
      $id: h.id,
      $code: h.code,
      $title: h.title,
      $address: h.address,
      $zone: h.zone,
      $coord_x: h.coord_x,
      $coord_y: h.coord_y,
      $coord_z: h.coord_z,
      $house_type: h.house_type,
      $floor_elevation: h.floor_elevation,
      $alley_elevation: h.alley_elevation,
      $digital_access: h.digital_access,
      $area_risk: h.area_risk,
      $access_status: h.access_status,
      $special_notes: h.special_notes,
    });
  }

  // Seed Residents (including Mrs. Somjit in A-012)
  db.run(`
    INSERT INTO residents (id, household_code, name, age, is_bedridden, requires_oxygen, oxygen_reserve_mins, mobility_constraint)
    VALUES ('res-12', 'A-012', 'นางสมจิตร รัตนประสิทธิ์', 82, 1, 1, 90, 'ติดเตียง เคลื่อนย้ายด้วยเปลสนามเท่านั้น');
  `);
  db.run(`
    INSERT INTO residents (id, household_code, name, age, is_bedridden, requires_oxygen, oxygen_reserve_mins, mobility_constraint)
    VALUES ('res-12-carer', 'A-012', 'นางกรรณิการ์ รัตนประสิทธิ์ (บุตรสาว)', 56, 0, 0, 0, 'ผู้ดูแลหลัก');
  `);

  // Seed Walkway Network Nodes
  const insertNode = db.prepare(`
    INSERT INTO walkway_nodes (id, name, x, y, elevation, node_type)
    VALUES ($id, $name, $x, $y, $elevation, $node_type);
  `);

  const nodes = [
    { id: 'NODE_HOUSE_A012', name: 'หน้าบ้าน A-012 (ตรอกลุ่มต่ำ)', x: -7, y: -80, elevation: 0.14, node_type: 'house' },
    { id: 'NODE_ALLEY_NORTH', name: 'ตรอกซอยสายเหนือ', x: -7, y: -60, elevation: 0.18, node_type: 'junction' },
    { id: 'NODE_BOARDWALK_J2', name: 'สะพานไม้ชั่วคราวทางแยก 2', x: 8, y: -60, elevation: 0.50, node_type: 'boardwalk' },
    { id: 'NODE_EAST_ALLEY', name: 'ตรอกสายตะวันออก', x: 20, y: -58, elevation: 0.35, node_type: 'junction' },
    { id: 'NODE_COMMUNITY_CENTER', name: 'ศูนย์ชุมชน / จุดพักพิง Shelter A', x: 37, y: -18, elevation: 0.40, node_type: 'shelter' },
    { id: 'NODE_PLAZA_FORECOURT', name: 'ระเบียงลานหน้าศูนย์ชุมชน (ทางเลี่ยงยกระดับ)', x: 37, y: 1, elevation: 0.45, node_type: 'junction' },
    { id: 'NODE_MEDICAL_POINT_B', name: 'จุดส่งต่อการแพทย์ B (ลานหน้าวัด/สุขศาลา)', x: 28, y: 35, elevation: 0.38, node_type: 'medical_point' },
    { id: 'NODE_HEALTH_CENTER', name: 'สุขศาลาชุมชนวัดเทวราช', x: 28, y: 55, elevation: 0.35, node_type: 'medical_point' },
    { id: 'NODE_MAIN_ROAD_JUNCTION', name: 'ปากทางถนนใหญ่ (จุดรถพยาบาลเทียบ)', x: 12, y: 35, elevation: 0.35, node_type: 'junction' },
    { id: 'NODE_BRIDGE_DECK', name: 'สะพานหลักข้ามคลอง', x: 71, y: 22, elevation: 0.85, node_type: 'bridge' },
  ];

  for (const n of nodes) {
    insertNode.run({
      $id: n.id,
      $name: n.name,
      $x: n.x,
      $y: n.y,
      $elevation: n.elevation,
      $node_type: n.node_type,
    });
  }

  // Seed Walkway Network Edges (Bidirectional)
  const insertEdge = db.prepare(`
    INSERT INTO walkway_edges (id, source_id, target_id, distance_meters, width_meters, min_elevation, is_boardwalk)
    VALUES ($id, $source_id, $target_id, $distance_meters, $width_meters, $min_elevation, $is_boardwalk);
  `);

  const edges = [
    // House A-012 to North Alley (Concrete alley pavement - stretcher team wades through)
    { id: 'E1', source_id: 'NODE_HOUSE_A012', target_id: 'NODE_ALLEY_NORTH', distance_meters: 20, width_meters: 2.2, min_elevation: 0.14, is_boardwalk: 0 },
    // North Alley to Boardwalk J2 (Raised wooden boardwalk on stilts, submerged when river exceeds 0.55m)
    { id: 'E2', source_id: 'NODE_ALLEY_NORTH', target_id: 'NODE_BOARDWALK_J2', distance_meters: 15, width_meters: 1.8, min_elevation: 0.50, is_boardwalk: 1 },
    // Boardwalk J2 to East Alley
    { id: 'E3', source_id: 'NODE_BOARDWALK_J2', target_id: 'NODE_EAST_ALLEY', distance_meters: 12, width_meters: 2.0, min_elevation: 0.50, is_boardwalk: 1 },
    // East Alley to Community Center
    { id: 'E4', source_id: 'NODE_EAST_ALLEY', target_id: 'NODE_COMMUNITY_CENTER', distance_meters: 42, width_meters: 2.5, min_elevation: 0.35, is_boardwalk: 0 },
    // Community Center to Forecourt (Elevated Bypass!)
    { id: 'E5', source_id: 'NODE_COMMUNITY_CENTER', target_id: 'NODE_PLAZA_FORECOURT', distance_meters: 20, width_meters: 4.0, min_elevation: 0.45, is_boardwalk: 0 },
    // Plaza Forecourt to Medical Point B
    { id: 'E6', source_id: 'NODE_PLAZA_FORECOURT', target_id: 'NODE_MEDICAL_POINT_B', distance_meters: 26, width_meters: 3.5, min_elevation: 0.38, is_boardwalk: 0 },
    // Medical Point B to Main Road Junction (EMS transfer point)
    { id: 'E7', source_id: 'NODE_MEDICAL_POINT_B', target_id: 'NODE_MAIN_ROAD_JUNCTION', distance_meters: 16, width_meters: 5.5, min_elevation: 0.35, is_boardwalk: 0 },
    // Elevated Bypass: North Alley directly around behind Community Center (Detour bypass when Boardwalk J2 is submerged)
    { id: 'E8_BYPASS', source_id: 'NODE_ALLEY_NORTH', target_id: 'NODE_PLAZA_FORECOURT', distance_meters: 125, width_meters: 2.4, min_elevation: 0.45, is_boardwalk: 0 },
  ];

  for (const e of edges) {
    insertEdge.run({
      $id: e.id,
      $source_id: e.source_id,
      $target_id: e.target_id,
      $distance_meters: e.distance_meters,
      $width_meters: e.width_meters,
      $min_elevation: e.min_elevation,
      $is_boardwalk: e.is_boardwalk,
    });
    // Add reverse direction
    insertEdge.run({
      $id: e.id + '_REV',
      $source_id: e.target_id,
      $target_id: e.source_id,
      $distance_meters: e.distance_meters,
      $width_meters: e.width_meters,
      $min_elevation: e.min_elevation,
      $is_boardwalk: e.is_boardwalk,
    });
  }

  // Seed Initial Critical Incident
  db.run(`
    INSERT INTO incidents (id, code, category, severity, status, reported_at, location_name, target_household, description, current_water_depth_cm, recommended_plan_id)
    VALUES ('inc-001', 'INC-2024-001', 'medical_critical', 'critical', 'open', '20:20', 'บ้าน A-012 (หลังตลาดเก่า)', 'A-012', 'ผู้ป่วยติดเตียง (ยายสมจิตร 82 ปี) ออกซิเจนสำรองเหลือ 90 นาที น้ำท่วมซอย 35 ซม. รถพยาบาลเข้าไม่ได้', 35, 'PLAN_B');
  `);

  console.log('[DB] Seeding completed successfully.');
}

export function seedChecklist() {
  const insertCheck = db.prepare(`
    INSERT OR REPLACE INTO checklist_items (id, category, title, is_done, completed_at, completed_by)
    VALUES ($id, $category, $title, $is_done, $completed_at, $completed_by);
  `);
  const defaultChecks = [
    { id: 'p1', category: 'vulnerable', title: 'ตรวจสอบกลุ่มเปราะบางบ้าน A-012 (ออกซิเจนสำรอง 90 นาที)', is_done: 1, completed_at: '20:10', completed_by: 'Community Shield AI' },
    { id: 'p2', category: 'offline', title: 'ส่งทีมเคาะประตูบ้านที่ไม่มีระบบดิจิทัล (A-002, A-007, A-014)', is_done: 0, completed_at: null, completed_by: null },
    { id: 'a1', category: 'infrastructure', title: 'ตรวจสอบโครงสร้างสะพานไม้ยกสูงชั่วคราว Zone C', is_done: 0, completed_at: null, completed_by: null },
    { id: 'r1', category: 'logistics', title: 'จัดเตรียมชุดเปลสนาม Community Team 02', is_done: 1, completed_at: '20:15', completed_by: 'ผู้ประสานงานศูนย์' },
    { id: 'pl1', category: 'shelter', title: 'ตรวจความจุ Shelter A (วัดเทวราช: ว่าง 18 ที่)', is_done: 1, completed_at: '20:05', completed_by: 'เจ้าหน้าที่วัดเทวราช' },
  ];
  for (const c of defaultChecks) {
    insertCheck.run({
      $id: c.id,
      $category: c.category,
      $title: c.title,
      $is_done: c.is_done,
      $completed_at: c.completed_at,
      $completed_by: c.completed_by,
    });
  }
}

export function seedNurseNotes() {
  const insertNote = db.prepare(`
    INSERT OR REPLACE INTO nurse_notes (
      id, household_code, patient_name, triage_level,
      spo2, pulse, blood_pressure, oxygen_flow_lpm, oxygen_reserve_mins,
      triage_notes, transfer_target, transfer_status, recorded_by, recorded_at
    ) VALUES (
      $id, $household_code, $patient_name, $triage_level,
      $spo2, $pulse, $blood_pressure, $oxygen_flow_lpm, $oxygen_reserve_mins,
      $triage_notes, $transfer_target, $transfer_status, $recorded_by, $recorded_at
    );
  `);

  const initialNotes = [
    {
      id: 'nurse-001',
      household_code: 'A-012',
      patient_name: 'ยายสมจิตร บุญรักษา (82 ปี)',
      triage_level: 'red',
      spo2: 91,
      pulse: 98,
      blood_pressure: '142/88',
      oxygen_flow_lpm: 3.0,
      oxygen_reserve_mins: 90,
      triage_notes: 'ผู้ป่วยติดเตียง หายใจเหนื่อยตื้น ออกซิเจนสำรองใกล้หมด ตรอกซอยน้ำท่วมสูง 38 ซม. ต้องการเคลื่อนย้ายส่ง รพ.วชิรพยาบาล ด่วนที่สุด',
      transfer_target: 'โรงพยาบาลวชิรพยาบาล (คณะแพทยศาสตร์วชิรพยาบาล)',
      transfer_status: 'relaying',
      recorded_by: 'พว. นงลักษณ์ สุขสวัสดิ์ (พยาบาลวิชาชีพ จุดคัดกรอง B)',
      recorded_at: '20:20',
    },
    {
      id: 'nurse-002',
      household_code: 'C-004',
      patient_name: 'ยายม่อม บุญเกื้อ (79 ปี)',
      triage_level: 'yellow',
      spo2: 95,
      pulse: 84,
      blood_pressure: '135/82',
      oxygen_flow_lpm: 0,
      oxygen_reserve_mins: 0,
      triage_notes: 'ข้อเข่าเสื่อม ปวดข้อเรื้อรัง เดินลำบาก อยู่ในจุดคอขวดระบายน้ำ มีหลานดูแล ต้องการเจ้าหน้าที่ช่วยพยุงอพยพเมื่อน้ำแตะ 50 ซม.',
      transfer_target: 'ศูนย์พักพิงวัดเทวราชกุญชร (Shelter A)',
      transfer_status: 'pending',
      recorded_by: 'พว. ภัทรพล จันทร์เพ็ญ (หน่วยพยาบาลชุมชน)',
      recorded_at: '20:15',
    },
    {
      id: 'nurse-003',
      household_code: 'B-008',
      patient_name: 'นายประสิทธิ์ มีสุข (74 ปี)',
      triage_level: 'green',
      spo2: 97,
      pulse: 76,
      blood_pressure: '128/80',
      oxygen_flow_lpm: 0,
      oxygen_reserve_mins: 0,
      triage_notes: 'ผู้สูงอายุ โรคความดันโลหิตสูง มียาประจำตัวพอ 5 วัน สื่อสารได้ดี เคลื่อนไหวได้เอง ติดตามเฝ้าระวังระดับน้ำตามรอบปกติ',
      transfer_target: 'ศูนย์พักพิงวัดเทวราชกุญชร (Shelter A)',
      transfer_status: 'pending',
      recorded_by: 'จนท. อนามัยชุมชน',
      recorded_at: '20:05',
    },
  ];

  for (const n of initialNotes) {
    insertNote.run({
      $id: n.id,
      $household_code: n.household_code,
      $patient_name: n.patient_name,
      $triage_level: n.triage_level,
      $spo2: n.spo2,
      $pulse: n.pulse,
      $blood_pressure: n.blood_pressure,
      $oxygen_flow_lpm: n.oxygen_flow_lpm,
      $oxygen_reserve_mins: n.oxygen_reserve_mins,
      $triage_notes: n.triage_notes,
      $transfer_target: n.transfer_target,
      $transfer_status: n.transfer_status,
      $recorded_by: n.recorded_by,
      $recorded_at: n.recorded_at,
    });
  }
}

export function resetDatabaseToBaseline() {
  console.log('[DB] Resetting database to baseline state...');
  db.run("UPDATE households SET access_status = 'confirmed_safe', area_risk = 'watch' WHERE code NOT IN ('A-004', 'A-011', 'A-013', 'A-016', 'A-008', 'A-009', 'A-010', 'A-012')");
  db.run("UPDATE households SET access_status = 'confirmed_safe', area_risk = 'normal' WHERE code IN ('A-004', 'A-011', 'A-013', 'A-016')");
  db.run("UPDATE households SET access_status = 'followup_needed', area_risk = 'high_risk' WHERE code IN ('A-008', 'A-010')");
  db.run("UPDATE households SET access_status = 'confirmed_safe', area_risk = 'high_risk' WHERE code = 'A-009'");
  db.run("UPDATE households SET access_status = 'critical_help_needed', area_risk = 'critical' WHERE code = 'A-012'");
  
  db.run("DELETE FROM field_reports WHERE id != 'seed-init'");
  db.run("DELETE FROM tasks WHERE code != 'TASK #A-012'");
  db.run("UPDATE tasks SET status = 'accepted' WHERE code = 'TASK #A-012'");

  seedChecklist();
}

// Ensure database tables and seed are initialized on import
initDatabase();

