/**
 * Core Data Models & Type Definitions for Community Shield (ประชาอารักษ์)
 * Wat Thewarat Kunchorn Community, Dusit District, Bangkok
 */

// 1. Dual Status Color System
export type AreaRiskLevel = 'normal' | 'watch' | 'high_risk' | 'critical';
export type HouseholdAccessStatus = 'confirmed_safe' | 'followup_needed' | 'hard_to_access' | 'critical_help_needed';

export interface AreaRiskMetadata {
  level: AreaRiskLevel;
  labelTh: string;
  colorHex: string;
  badgeBg: string;
  description: string;
}

export interface HouseholdAccessMetadata {
  status: HouseholdAccessStatus;
  labelTh: string;
  colorHex: string;
  badgeBg: string;
  description: string;
}

// 2. Sensor & Hydrological Data
export interface WaterSensorReading {
  id: string;
  timestamp: string; // e.g. "20:00"
  timeMinutes: number; // 0 for 20:00, 30 for 20:30, etc.
  actualLevelMeters: number | null; // Green line (null if forecast)
  forecastLevelMeters: number | null; // Orange line (null if pure past)
  rateOfRiseMetersPerHour: number; // e.g. +0.34 m/hr (+0.17 m / 30 min)
  rainfallMmPerHour: number;
  batteryPercent: number;
  signalQuality: 'good' | 'fair' | 'poor' | 'offline';
  isAlertThresholdExceeded: boolean;
}

// 3. Preparation Window
export interface PreparationChecklistItem {
  id: string;
  category: 'people' | 'area' | 'resource' | 'plan';
  titleTh: string;
  descriptionTh: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'normal';
}

export interface PreparationWindow {
  currentSimTime: string; // e.g. "20:10"
  targetTime: string; // e.g. "22:00"
  remainingMinutes: number; // e.g. 110 minutes
  criticalThresholdMeters: number; // 1.00m
  checklists: PreparationChecklistItem[];
}

// 4. Household Registry
export interface HouseholdResident {
  id: string;
  name: string;
  age: number;
  isBedridden?: boolean;
  hasChronicIllness?: boolean;
  requiresOxygen?: boolean;
  oxygenTankReserveMinutes?: number;
  mobilityConstraint?: string;
}

export interface Household {
  id: string;
  code: string; // e.g. "HOUSE_012" or "A-012"
  title: string;
  address: string;
  zone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D';
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  houseType: 'House_Type_A_Gable' | 'House_Type_B_Hip' | 'House_Type_C_Two_Storey' | 'House_Type_D_Raised_Timber';
  floorElevationMeters: number; // e.g. 0.55m or 1.65m for stilt
  alleyElevationMeters: number; // Ground level in front of house
  residents: HouseholdResident[];
  digitalAccess: 'smartphone_online' | 'feature_phone_call_only' | 'no_phone_offline';
  areaRiskLevel: AreaRiskLevel;
  accessStatus: HouseholdAccessStatus;
  lastContactedAt?: string;
  specialNotesTh?: string;
}

// 5. Incident Center
export type IncidentCategory = 'medical_critical' | 'water_rise' | 'drainage_bottleneck' | 'road_submerged' | 'tree_obstruction';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'plan_recommended' | 'plan_approved' | 'task_dispatched' | 'team_on_site' | 'resolved';

export interface Incident {
  id: string;
  code: string; // e.g. "INC-2024-001"
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string; // e.g. "20:20"
  locationName: string;
  targetHouseholdId?: string;
  descriptionTh: string;
  aiExplanationTh: string; // AI Explainability why this is high risk
  currentWaterDepthCm: number;
  recommendedPlanId?: string;
  approvedPlanId?: string;
  assignedTaskId?: string;
}

// 6. AI Decision Support & 3 Evacuation Plans
export type PlanType = 'PLAN_A' | 'PLAN_B' | 'PLAN_C';

export interface RescuePlan {
  id: string;
  planType: PlanType;
  titleTh: string;
  subtitleTh: string;
  descriptionTh: string;
  recommended: boolean;
  feasibilityScore: number; // 0 - 100
  prosTh: string[];
  consTh: string[];
  requiredResources: {
    communityVolunteersCount: number;
    stretcherRequired: boolean;
    emsAmbulanceRequired: boolean;
    boatRequired: boolean;
  };
  relayRoute: {
    startPoint: string;
    intermediateRelayPoint?: string; // e.g. "จุดเชื่อมต่อการแพทย์ B (หน้าศูนย์สุขภาพ)"
    finalDestination: string; // e.g. "โรงพยาบาลวชิรพยาบาล"
    totalEstimatedDistanceMeters: number;
    estimatedTransitMinutes: number;
  };
  constraintWarningsTh: string[];
}

// 7. Response Task & Field Operations
export type TaskStatus = 'pending' | 'accepted' | 'traveling' | 'arrived' | 'inspecting' | 'reported' | 'closed';

export interface FieldReport {
  id: string;
  taskId: string;
  submittedAt: string;
  teamCode: string;
  actualWaterDepthCm: number;
  alleyPassableOnFoot: boolean;
  boardwalkStructureSafe: boolean;
  patientConditionSummaryTh: string;
  photoUrl?: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  triggersReplanning: boolean;
  replanningReasonTh?: string;
}

export interface ResponseTask {
  id: string;
  code: string; // e.g. "TASK #A-012"
  incidentId: string;
  priority: 'critical' | 'high' | 'medium';
  titleTh: string;
  missionObjectiveTh: string;
  targetHouseholdId: string;
  assignedTeam: string; // e.g. "Community Team 02"
  destinationPoint: string; // e.g. "Medical Point B"
  status: TaskStatus;
  createdAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  fieldReport?: FieldReport;
}

// 8. Dynamic Simulation State
export interface SimulationTimelineStep {
  timeLabel: string; // e.g. "20:00", "20:10", "20:15", "20:20", "20:23", "20:30", "20:32"
  titleTh: string;
  descriptionTh: string;
  waterLevelMeters: number; // Global river/canal water elevation
  alleyWaterDepthCm: number; // Water depth in low alleys
  activeIncidentCode?: string;
  activeTaskId?: string;
  blockedRoadNames: string[];
  systemAlertMessageTh?: string;
}
