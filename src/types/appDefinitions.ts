// src/types/appDefinitions.ts

// ==========================================
// アプリ固有の状態・ロジック型定義
// ==========================================

export type AppMode = "normal" | "reversed" | "motor";
export type EquipmentInputMode = "device_watt" | "device_amp" | "breaker_limit";
export type CalculationInputMode = "amp" | "watt";
export type LoadType = "general" | "motor";
export type EnvironmentType = "normal" | "enclosure" | "wet";
export type PowerFrequency = 50 | 60;
export type MotorBreakerType = "auto" | "motor_breaker" | "mccb";

export interface MotorBreakerSelectionResult {
  selectedType: "motor_breaker" | "mccb";
  recommendedAmp: number;
  requiresThermalRelay: boolean;
  isOver15kW: boolean;
  warningNote?: string;
}

export interface GroundingResult {
  groundType: "D種接地工事" | "C種接地工事";
  groundResistance: number;
  allowableResistanceWithElcb: number;
  insulationResistance: number;
  groundWireDiameter: string;
  requiresELCB: boolean;
  notes: string[];
}

export interface ElcbSelectionResult {
  recommendedAmp: number;
  sensitivityCurrent: number;
  operatingTime: string;
  maxGroundResistance: number;
  isMandatory: boolean;
  description: string;
}

export interface CapacitorSelectionResult {
  requiredKvar: number;
  recommendedKvar: number;
  recommendedMicroFarad?: number;
  improvedPowerFactor?: number;
  dischargeResistorNote: string;
  isTableStandard?: boolean;
}

export interface SelectBreakerParams {
  outputKw: number;
  singleAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  wireAllowAmp?: number;
  breakerTypeMode: MotorBreakerType;
  driveMode: "direct" | "inverter";
  environment?: EnvironmentType;
}

export type BreakerSelectParams = SelectBreakerParams;

export interface MotorSpec {
  kw: number;
  amp: number;
  defaultCosTheta: number;
}

export interface BreakerStatusResult {
  is20AOk: boolean;
  currentLoad: number;
  recommendedBreaker: number;
  message: string;
}

export interface CalculationIssue {
  level: "error" | "warning" | "info";
  code: string;
  title: string;
  message: string;
}

export interface CapacitorTableEntry {
  kw: number;
  uf50Hz: number;
  kvar50Hz: number;
  uf60Hz: number;
  kvar60Hz: number;
}

// ==========================================
// 配線・ケーブル定義は cableBase に一本化
// ==========================================

export type {
  InstallationType,
  CableTypeCode,
  CableType,
  WireSize,
  SystemType,
  CableSpec,
  AvailableWireResult,
  ReductionFactorEntry,
  VoltageDropParams,
  WireSelectionParams,
} from "@/base/cableBase";

export {
  WIRE_SIZES,
  REDUCTION_FACTOR_TABLE,
  CABLE_TYPES,
  CABLE_TEMP_GROUPS,
  SYSTEM_DEFINITIONS,
  CABLE_SPECS,
  REDUCTION_FACTORS,
  calculateK1,
  calculateK2,
  calculateAllowableCurrent,
} from "@/base/cableBase";

// ==========================================
// アプリ固有の定数・マスタデータ
// ==========================================

export const MOTOR_SPECS: MotorSpec[] = [
  { kw: 0.2, amp: 1.8, defaultCosTheta: 0.8 },
  { kw: 0.4, amp: 3.2, defaultCosTheta: 0.8 },
  { kw: 0.75, amp: 4.8, defaultCosTheta: 0.8 },
  { kw: 1.5, amp: 8.0, defaultCosTheta: 0.8 },
  { kw: 2.2, amp: 11.1, defaultCosTheta: 0.8 },
  { kw: 3.7, amp: 17.4, defaultCosTheta: 0.85 },
  { kw: 5.5, amp: 26.0, defaultCosTheta: 0.85 },
  { kw: 7.5, amp: 34.0, defaultCosTheta: 0.85 },
  { kw: 11.0, amp: 48.0, defaultCosTheta: 0.88 },
  { kw: 15.0, amp: 65.0, defaultCosTheta: 0.88 },
];

export const BREAKER_SIZES = [
  15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300,
];

export const THREE_PHASE_BREAKER_SIZES = [
  20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300, 400,
];

export const MOTOR_CAPACITOR_TABLE_200V: CapacitorTableEntry[] = [
  { kw: 0.2, uf50Hz: 15, kvar50Hz: 0.19, uf60Hz: 10, kvar60Hz: 0.15 },
  { kw: 0.4, uf50Hz: 20, kvar50Hz: 0.25, uf60Hz: 15, kvar60Hz: 0.23 },
  { kw: 0.75, uf50Hz: 30, kvar50Hz: 0.38, uf60Hz: 20, kvar60Hz: 0.3 },
  { kw: 1.0, uf50Hz: 30, kvar50Hz: 0.38, uf60Hz: 20, kvar60Hz: 0.3 },
  { kw: 1.1, uf50Hz: 30, kvar50Hz: 0.38, uf60Hz: 20, kvar60Hz: 0.3 },
  { kw: 1.5, uf50Hz: 40, kvar50Hz: 0.5, uf60Hz: 30, kvar60Hz: 0.45 },
  { kw: 2.0, uf50Hz: 50, kvar50Hz: 0.63, uf60Hz: 40, kvar60Hz: 0.6 },
  { kw: 2.2, uf50Hz: 50, kvar50Hz: 0.63, uf60Hz: 40, kvar60Hz: 0.6 },
  { kw: 3.0, uf50Hz: 50, kvar50Hz: 0.63, uf60Hz: 40, kvar60Hz: 0.6 },
  { kw: 3.7, uf50Hz: 75, kvar50Hz: 0.94, uf60Hz: 50, kvar60Hz: 0.75 },
  { kw: 4.0, uf50Hz: 75, kvar50Hz: 0.94, uf60Hz: 50, kvar60Hz: 0.75 },
  { kw: 5.0, uf50Hz: 100, kvar50Hz: 1.26, uf60Hz: 75, kvar60Hz: 1.13 },
  { kw: 5.5, uf50Hz: 100, kvar50Hz: 1.26, uf60Hz: 75, kvar60Hz: 1.13 },
  { kw: 7.5, uf50Hz: 150, kvar50Hz: 1.88, uf60Hz: 100, kvar60Hz: 1.51 },
  { kw: 10.0, uf50Hz: 200, kvar50Hz: 2.51, uf60Hz: 150, kvar60Hz: 2.26 },
  { kw: 11.0, uf50Hz: 200, kvar50Hz: 2.51, uf60Hz: 150, kvar60Hz: 2.26 },
  { kw: 15.0, uf50Hz: 250, kvar50Hz: 3.14, uf60Hz: 200, kvar60Hz: 3.02 },
  { kw: 19.0, uf50Hz: 300, kvar50Hz: 3.77, uf60Hz: 250, kvar60Hz: 3.77 },
  { kw: 20.0, uf50Hz: 300, kvar50Hz: 3.77, uf60Hz: 250, kvar60Hz: 3.77 },
  { kw: 22.0, uf50Hz: 400, kvar50Hz: 5.03, uf60Hz: 300, kvar60Hz: 4.52 },
  { kw: 25.0, uf50Hz: 400, kvar50Hz: 5.06, uf60Hz: 300, kvar60Hz: 4.52 },
  { kw: 30.0, uf50Hz: 500, kvar50Hz: 6.28, uf60Hz: 400, kvar60Hz: 6.03 },
  { kw: 37.0, uf50Hz: 600, kvar50Hz: 7.54, uf60Hz: 500, kvar60Hz: 7.54 },
  { kw: 40.0, uf50Hz: 600, kvar50Hz: 7.54, uf60Hz: 500, kvar60Hz: 7.54 },
  { kw: 45.0, uf50Hz: 750, kvar50Hz: 9.42, uf60Hz: 600, kvar60Hz: 9.04 },
  { kw: 50.0, uf50Hz: 900, kvar50Hz: 11.3, uf60Hz: 750, kvar60Hz: 11.3 },
  { kw: 55.0, uf50Hz: 900, kvar50Hz: 11.3, uf60Hz: 750, kvar60Hz: 11.3 },
];

export * from "@/base/airconBase";
export * from "@/utils/airconCalc";
