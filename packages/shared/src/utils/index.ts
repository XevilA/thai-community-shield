/**
 * Utility functions for Community Shield (ประชาอารักษ์)
 */

import { AreaRiskLevel, Household, WaterSensorReading } from '../types';
import { AREA_RISK_MAP, HOUSEHOLD_ACCESS_MAP } from '../constants';

/**
 * Calculates rate of rise in meters per hour
 */
export function calculateRateOfRise(
  prevLevelMeters: number,
  currentLevelMeters: number,
  deltaMinutes: number
): number {
  if (deltaMinutes <= 0) return 0;
  const deltaHours = deltaMinutes / 60;
  return Number(((currentLevelMeters - prevLevelMeters) / deltaHours).toFixed(2));
}

/**
 * Evaluates area flood risk level based on water level, rain, and terrain elevation
 */
export function evaluateAreaRisk(
  waterLevelMeters: number,
  rainfallMmPerHour: number,
  terrainElevationMeters: number
): AreaRiskLevel {
  const relativeDepth = waterLevelMeters - terrainElevationMeters;

  if (relativeDepth >= 0.4 || waterLevelMeters >= 0.9) {
    return 'critical';
  }
  if (relativeDepth >= 0.2 || waterLevelMeters >= 0.65 || rainfallMmPerHour >= 50) {
    return 'high_risk';
  }
  if (relativeDepth >= 0.05 || waterLevelMeters >= 0.5) {
    return 'watch';
  }
  return 'normal';
}

/**
 * Generates an explainable AI rationale for a given household & risk situation
 */
export function generateAiExplanation(
  household: Household,
  sensorReading: WaterSensorReading,
  roadBlocked: boolean = false
): string {
  const reasons: string[] = [];

  if (sensorReading.rateOfRiseMetersPerHour >= 0.3) {
    reasons.push(`ระดับน้ำแม่น้ำเจ้าพระยาเพิ่มขึ้นอย่างรวดเร็ว (+${sensorReading.rateOfRiseMetersPerHour} ม./ชม.)`);
  }
  if (sensorReading.rainfallMmPerHour >= 40) {
    reasons.push(`มีฝนตกหนักสะสมในพื้นที่ (${sensorReading.rainfallMmPerHour} มม./ชม.)`);
  }
  if (household.alleyElevationMeters <= 0.1) {
    reasons.push('พื้นที่หน้าบ้านมีลักษณะเป็นแอ่งลุ่มต่ำ เสี่ยงต่อการสะสมของมวลน้ำก่อนพื้นที่อื่น');
  }
  if (roadBlocked) {
    reasons.push('เส้นทางตรอกหลักถูกน้ำท่วมขังเกิน 35 ซม. รถพยาบาลขนาดมาตรฐานไม่สามารถผ่านได้');
  }

  const bedridden = household.residents.find((r) => r.isBedridden);
  if (bedridden) {
    reasons.push(
      `มีผู้ป่วยติดเตียง (${bedridden.name} อายุ ${bedridden.age} ปี) ` +
        (bedridden.requiresOxygen && bedridden.oxygenTankReserveMinutes
          ? `และออกซิเจนสำรองเหลือจำกัดเพียง ${bedridden.oxygenTankReserveMinutes} นาที`
          : 'ไม่สามารถเคลื่อนย้ายได้เอง')
    );
  }

  if (household.digitalAccess === 'no_phone_offline') {
    reasons.push('ครัวเรือนไม่มีช่องทางออนไลน์/สมาร์ตโฟน ต้องพึ่งพาการตรวจสอบทางกายภาพโดยตรง');
  }

  return (
    `การประเมินสถานะ ${AREA_RISK_MAP[household.areaRiskLevel].labelTh} ` +
    `ร่วมกับสถานะช่วยเหลือ ${HOUSEHOLD_ACCESS_MAP[household.accessStatus].labelTh} ` +
    `เนื่องจาก: ${reasons.join(' • ')}`
  );
}

/**
 * 2D Euclidean distance between coordinates in meters
 */
export function calculateDistance(
  coord1: { x: number; y: number },
  coord2: { x: number; y: number }
): number {
  const dx = coord1.x - coord2.x;
  const dy = coord1.y - coord2.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

/**
 * Formats water depth in meters or centimeters
 */
export function formatWaterDepth(meters: number): string {
  if (meters < 1) {
    return `${Math.round(meters * 100)} ซม.`;
  }
  return `${meters.toFixed(2)} ม.`;
}
