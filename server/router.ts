/**
 * Real Graph Pathfinder & Dynamic Replanning Engine
 * Implements Dijkstra's Algorithm on Community Walkways with Flood Constraints
 */

import { db } from './db';
import { calculateWaterDepthCm, evaluatePassability } from './hydrology';

export interface RouteResult {
  pathNodeIds: string[];
  pathNodeNames: string[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  passable: boolean;
  blockageReason?: string;
  waypoints3D: Array<{ x: number; y: number; z: number }>;
}

interface EdgeRow {
  id: string;
  source_id: string;
  target_id: string;
  distance_meters: number;
  width_meters: number;
  min_elevation: number;
  is_boardwalk: number;
  is_submerged: number;
}

interface NodeRow {
  id: string;
  name: string;
  x: number;
  y: number;
  elevation: number;
  node_type: string;
}

/**
 * Dijkstra Shortest Path Finder
 */
export function findShortestPath(
  startNodeId: string,
  targetNodeId: string,
  currentWaterLevelMeters: number,
  mode: 'pedestrian' | 'stretcher' | 'ambulance' = 'stretcher',
  boardwalkSubmergedIds: Set<string> = new Set()
): RouteResult {
  const nodes = db.query('SELECT * FROM walkway_nodes').all() as NodeRow[];
  const edges = db.query('SELECT * FROM walkway_edges').all() as EdgeRow[];

  const nodeMap = new Map<string, NodeRow>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Build Adjacency List with dynamic flood impedance weights
  const adj = new Map<string, Array<{ target: string; weight: number; edge: EdgeRow }>>();
  for (const n of nodes) adj.set(n.id, []);

  for (const e of edges) {
    const depthCm = calculateWaterDepthCm(currentWaterLevelMeters, e.min_elevation);
    const isBoardwalkUnderwater = (e.is_boardwalk === 1 && depthCm > 5);
    const isSubmerged = e.is_submerged === 1 || isBoardwalkUnderwater || boardwalkSubmergedIds.has(e.id) || boardwalkSubmergedIds.has(e.source_id) || boardwalkSubmergedIds.has(e.target_id);

    const pass = evaluatePassability(depthCm, e.width_meters, e.is_boardwalk === 1, isSubmerged);

    let canTraverse = false;
    if (mode === 'ambulance') canTraverse = pass.ambulancePassable;
    else if (mode === 'stretcher') canTraverse = pass.stretcherPassable;
    else canTraverse = pass.pedestrianPassable;

    if (canTraverse) {
      const dynamicWeight = e.distance_meters * pass.impedanceFactor;
      adj.get(e.source_id)?.push({ target: e.target_id, weight: dynamicWeight, edge: e });
    }
  }

  // Priority queue / distances
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const n of nodes) {
    dist.set(n.id, Infinity);
    prev.set(n.id, null);
    unvisited.add(n.id);
  }
  dist.set(startNodeId, 0);

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let u: string | null = null;
    let minDist = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id)!;
      if (d < minDist) {
        minDist = d;
        u = id;
      }
    }

    if (!u || minDist === Infinity) break;
    if (u === targetNodeId) break;

    unvisited.delete(u);

    const neighbors = adj.get(u) || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.target)) continue;
      const alt = dist.get(u)! + edge.weight;
      if (alt < dist.get(edge.target)!) {
        dist.set(edge.target, alt);
        prev.set(edge.target, u);
      }
    }
  }

  // Reconstruct Path
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr) {
    path.unshift(curr);
    curr = prev.get(curr) || null;
  }

  // If start node was not reached
  if (path.length === 0 || path[0] !== startNodeId) {
    return {
      pathNodeIds: [],
      pathNodeNames: [],
      totalDistanceMeters: 0,
      estimatedMinutes: 0,
      passable: false,
      blockageReason:
        mode === 'ambulance'
          ? 'รถพยาบาลไม่สามารถเข้าถึงได้เนื่องจากซอยแคบ (< 3.0 ม.) หรือระดับน้ำท่วมขังเกินระยะ clearance ของรถ'
          : 'เส้นทางทางเดินถูกน้ำท่วมตัดขาด ไม่สามารถสัญจรด้วยเปลสนามได้',
      waypoints3D: [],
    };
  }

  // Calculate actual distance & 3D waypoints
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = edges.find((ed) => ed.source_id === path[i] && ed.target_id === path[i + 1]);
    if (e) totalDistance += e.distance_meters;
  }

  const pathNodeNames = path.map((id) => nodeMap.get(id)?.name || id);
  const waypoints3D = path.map((id) => {
    const n = nodeMap.get(id)!;
    return { x: n.x, y: n.elevation, z: n.y };
  });

  // Transit time: Stretcher team walking speed in flood conditions ≈ 25 - 35 m/min
  const estimatedMinutes = Math.max(2, Math.round(totalDistance / 28));

  return {
    pathNodeIds: path,
    pathNodeNames,
    totalDistanceMeters: Math.round(totalDistance),
    estimatedMinutes,
    passable: true,
    waypoints3D,
  };
}

/**
 * Evaluates the 3 Rescue Plans in real-time
 */
export function evaluateAllPlans(
  currentWaterLevel: number,
  boardwalkSubmergedIds: Set<string> = new Set()
) {
  // Plan A: Direct EMS (ambulance from Main Road to House A-012)
  const planARoute = findShortestPath(
    'NODE_MAIN_ROAD_JUNCTION',
    'NODE_HOUSE_A012',
    currentWaterLevel,
    'ambulance',
    boardwalkSubmergedIds
  );

  // Plan B: Community Relay (stretcher from House A-012 to Medical Point B)
  const planBRoute = findShortestPath(
    'NODE_HOUSE_A012',
    'NODE_MEDICAL_POINT_B',
    currentWaterLevel,
    'stretcher',
    boardwalkSubmergedIds
  );

  // Plan C: Early Evacuation to Shelter A
  const planCRoute = findShortestPath(
    'NODE_HOUSE_A012',
    'NODE_COMMUNITY_CENTER',
    currentWaterLevel,
    'stretcher',
    boardwalkSubmergedIds
  );

  return {
    planA: {
      id: 'PLAN_A',
      titleTh: 'Plan A — Direct EMS (รถพยาบาลตรงถึงบ้าน)',
      feasible: planARoute.passable,
      feasibilityScore: planARoute.passable ? 85 : 15,
      route: planARoute,
      reason: planARoute.blockageReason || 'ทางเข้าออกสะดวก',
    },
    planB: {
      id: 'PLAN_B',
      titleTh: 'Plan B — Community Medical Relay (แนะนำสูงสุด)',
      feasible: planBRoute.passable,
      feasibilityScore: planBRoute.passable ? 92 : 20,
      route: planBRoute,
      reason: planBRoute.passable
        ? `ใช้ทีมชุมชนแบกเปล ${planBRoute.totalDistanceMeters} ม. (${planBRoute.estimatedMinutes} นาที) ปลอดภัยต่อออกซิเจน 90 นาที`
        : 'สะพานไม้ชำรุด',
    },
    planC: {
      id: 'PLAN_C',
      titleTh: 'Plan C — Early Evacuation (อพยพเข้าศูนย์พักพิง Shelter A)',
      feasible: planCRoute.passable,
      feasibilityScore: 38, // Low because shelter has only 18 beds left & no oxygen equipment
      route: planCRoute,
      reason: 'ศูนย์พักพิงเหลือ 18 ที่ และไม่มีเครื่องผลิตออกซิเจนทางการแพทย์ระยะยาว',
    },
  };
}
