// src/types/appDefinitions.ts

// ==========================================
// 1. アプリ状態・ロジック型定義
// ==========================================

export type AppMode = 'normal' | 'reversed' | 'motor';
export type EquipmentInputMode = 'device_watt' | 'device_amp' | 'breaker_limit';
export type CalculationInputMode = 'amp' | 'watt';
export type LoadType = 'general' | 'motor';
export type InstallationType = 'conduit_3' | 'conduit_4' | 'ceiling_open' | 'staple_surface';

export type CableTypeCode = 
  | 'vv' 
  | 'vvr' 
  | 'iv' 
  | 'em_eef' 
  | 'em_ief' 
  | 'hiv' 
  | 'cv' 
  | 'cvd'
  | 'cvt' 
  | 'cvq'
  | 'cv_2c'
  | 'cv_3c'
  | 'cv_4c'
  | 'mlfc'
  | 'ow' 
  | 'dv'
  | 'vct'
  | 'vctf'
  | 'vff';

export type EnvironmentType = 'normal' | 'enclosure' | 'wet';
export type PowerFrequency = 50 | 60;

export type MotorBreakerType = 'auto' | 'motor_breaker' | 'mccb';

export interface MotorBreakerSelectionResult {
  selectedType: 'motor_breaker' | 'mccb';
  recommendedAmp: number;
  requiresThermalRelay: boolean;
  isOver15kW: boolean;
  warningNote?: string;
}

export interface GroundingResult {
  groundType: 'D種接地工事' | 'C種接地工事';
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
  driveMode: 'direct' | 'inverter';
  environment?: EnvironmentType;
}

// ==========================================
// 2. 配線・計算用 データインターフェース
// ==========================================

export interface CableType {
  id: CableTypeCode;
  name: string;
  desc: string;
  maxTemp: number; // 最高許容温度 (60, 75, 90)
  tempCategory: '60' | '75' | '90' | 'outdoor';
  limits: Record<string, number>;
  isIndoorWiringForbidden?: boolean; // 屋内配線（固定配線）使用不可フラグ
  warningMessage?: string; // 警告メッセージ
}

export interface WireSize {
  name: string;
  area: number;
  amp?: number;
}

export interface SystemType {
  id: string;
  label: string;
  defaultVoltage: number;
  k: number;
  kFactor: number;
}

export interface MotorSpec {
  kw: number;
  amp: number;
  defaultCosTheta: number;
}

export interface CableSpec {
  size: string;
  area: number;
  r: number;
  x: number;
  baseAllowAmp: Record<CableTypeCode, number>;
}

export interface AvailableWireResult {
  wireName: string;
  area: number;
  maxAmpereByDrop: number;
  allowAmpereByHeat: number;
  effectiveMaxAmp: number;
  isOkForLoad: boolean;
}

export interface BreakerStatusResult {
  is20AOk: boolean;
  currentLoad: number;
  recommendedBreaker: number;
  message: string;
}

export interface CalculationIssue {
  level: 'error' | 'warning' | 'info';
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

export interface ReductionFactorEntry {
  minWires: number;
  maxWires: number;
  factor: number;
}

// ==========================================
// 3. 定数・マスタデータ定義
// ==========================================

export const WIRE_SIZES: WireSize[] = [
  { name: '0.2 sq (2.5A)', area: 0.2, amp: 2.5 },
  { name: '0.3 sq (5A)', area: 0.3, amp: 5.0 },
  { name: '0.5 sq (5A)', area: 0.5, amp: 5.0 },
  { name: '0.75 sq (6.6A)', area: 0.75, amp: 6.6 },
  { name: '1.25 sq (11.6A)', area: 1.25, amp: 11.6 },
  { name: '1.6mm', area: 2.01, amp: 27 },
  { name: '2.0mm', area: 3.14, amp: 35 },
  { name: '2.6mm', area: 5.31, amp: 48 },
  { name: '2.0 sq', area: 2.0, amp: 19 },
  { name: '3.0 sq (30A)', area: 3.0, amp: 30.0 },
  { name: '3.5 sq', area: 3.5, amp: 30 },
  { name: '5.0 sq (40A)', area: 5.0, amp: 40.0 },
  { name: '5.5 sq', area: 5.5, amp: 42 },
  { name: '8.0 sq', area: 8.0, amp: 54 },
  { name: '14.0 sq', area: 14.0, amp: 76 },
  { name: '22.0 sq', area: 22.0, amp: 98 },
  { name: '38.0 sq', area: 38.0, amp: 140 },
  { name: '60.0 sq', area: 60.0, amp: 185 },
  { name: '100.0 sq', area: 100.0, amp: 255 },
  { name: '150.0 sq', area: 150.0, amp: 325 },
  { name: '200.0 sq', area: 200.0, amp: 390 },
  { name: '250.0 sq', area: 250.0, amp: 445 },
  { name: '325.0 sq', area: 325.0, amp: 525 }
];

export const REDUCTION_FACTOR_TABLE: ReductionFactorEntry[] = [
  { minWires: 1, maxWires: 3, factor: 0.70 },
  { minWires: 4, maxWires: 4, factor: 0.63 },
  { minWires: 5, maxWires: 6, factor: 0.56 },
  { minWires: 7, maxWires: 15, factor: 0.49 },
  { minWires: 16, maxWires: 40, factor: 0.43 },
  { minWires: 41, maxWires: Infinity, factor: 0.39 }
];

export const CABLE_TYPES: CableType[] = [
  {
    id: 'vv',
    name: 'VVF (平形ビニル)',
    desc: '標準室内配線 (許容温度 60℃)',
    maxTemp: 60,
    tempCategory: '60',
    limits: {
      '0.2 sq (2.5A)': 2.5, '0.3 sq (5A)': 5.0, '0.5 sq (5A)': 5.0, '0.75 sq (6.6A)': 6.6,
      '1.25 sq (11.6A)': 11.6, '1.6mm': 18, '2.0mm': 24, '2.6mm': 35, '2.0 sq': 19,
      '3.0 sq (30A)': 30.0, '3.5 sq': 27, '5.0 sq (40A)': 40.0, '5.5 sq': 37, '8.0 sq': 49,
      '14.0 sq': 69, '22.0 sq': 80.0
    }
  },
  {
    id: 'vvr',
    name: 'VVR (丸形ビニル)',
    desc: '幹配線・動力用丸形 (許容温度 60℃)',
    maxTemp: 60,
    tempCategory: '60',
    limits: {
      '0.2 sq (2.5A)': 2.5, '0.3 sq (5A)': 5.0, '0.5 sq (5A)': 5.0, '0.75 sq (6.6A)': 6.6,
      '1.25 sq (11.6A)': 11.6, '1.6mm': 18, '2.0mm': 24, '2.6mm': 35, '2.0 sq': 19,
      '3.0 sq (30A)': 30.0, '3.5 sq': 27, '5.0 sq (40A)': 40.0, '5.5 sq': 37, '8.0 sq': 49,
      '14.0 sq': 69, '22.0 sq': 80.0
    }
  },
  {
    id: 'iv',
    name: 'IV (ビニル絶縁電線)',
    desc: '配管内配線用 (許容温度 60℃)',
    maxTemp: 60,
    tempCategory: '60',
    limits: {
      '0.2 sq (2.5A)': 2.5, '0.3 sq (5A)': 5.0, '0.5 sq (5A)': 5.0, '0.75 sq (6.6A)': 6.6,
      '1.25 sq (11.6A)': 11.6, '1.6mm': 27, '2.0mm': 35, '2.6mm': 48, '2.0 sq': 27,
      '3.0 sq (30A)': 30.0, '3.5 sq': 37, '5.0 sq (40A)': 40.0, '5.5 sq': 49, '8.0 sq': 61,
      '14.0 sq': 88, '22.0 sq': 115
    }
  },
  {
    id: 'em_eef',
    name: 'EM-EEF (エコ電線平形)',
    desc: '耐燃性ポリエチレン (許容温度 75℃)',
    maxTemp: 75,
    tempCategory: '75',
    limits: {
      '0.2 sq (2.5A)': 2.8, '0.3 sq (5A)': 5.5, '0.5 sq (5A)': 5.5, '0.75 sq (6.6A)': 7.2,
      '1.25 sq (11.6A)': 13.0, '1.6mm': 21, '2.0mm': 28, '2.6mm': 40, '2.0 sq': 22,
      '3.0 sq (30A)': 33.0, '3.5 sq': 31, '5.0 sq (40A)': 44.0, '5.5 sq': 43, '8.0 sq': 56,
      '14.0 sq': 79, '22.0 sq': 105
    }
  },
  {
    id: 'em_ief',
    name: 'EM-IEF (エコ絶縁電線)',
    desc: '耐燃性ポリエチレン絶縁 (許容温度 75℃)',
    maxTemp: 75,
    tempCategory: '75',
    limits: {
      '0.2 sq (2.5A)': 2.8, '0.3 sq (5A)': 5.5, '0.5 sq (5A)': 5.5, '0.75 sq (6.6A)': 7.2,
      '1.25 sq (11.6A)': 13.0, '1.6mm': 31, '2.0mm': 40, '2.6mm': 55, '2.0 sq': 31,
      '3.0 sq (30A)': 34.0, '3.5 sq': 42, '5.0 sq (40A)': 46.0, '5.5 sq': 56, '8.0 sq': 70,
      '14.0 sq': 101, '22.0 sq': 132
    }
  },
  {
    id: 'hiv',
    name: 'HIV (二種耐熱形ビニル)',
    desc: '盤内・高耐熱配線 (許容温度 75℃)',
    maxTemp: 75,
    tempCategory: '75',
    limits: {
      '0.2 sq (2.5A)': 2.8, '0.3 sq (5A)': 5.5, '0.5 sq (5A)': 5.5, '0.75 sq (6.6A)': 7.2,
      '1.25 sq (11.6A)': 13.0, '1.6mm': 31, '2.0mm': 40, '2.6mm': 55, '2.0 sq': 31,
      '3.0 sq (30A)': 34.0, '3.5 sq': 42, '5.0 sq (40A)': 46.0, '5.5 sq': 56, '8.0 sq': 70,
      '14.0 sq': 101, '22.0 sq': 132
    }
  },
  {
    id: 'cv',
    name: 'CV 1C (単心3条)',
    desc: '高容量幹配線 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 33, '2.0mm': 44, '2.6mm': 57, '2.0 sq': 33, '3.5 sq': 44, '5.5 sq': 57,
      '8.0 sq': 78, '14.0 sq': 110, '22.0 sq': 145, '38.0 sq': 205, '60.0 sq': 275,
      '100.0 sq': 385, '150.0 sq': 495, '200.0 sq': 605, '250.0 sq': 700, '325.0 sq': 835
    }
  },
  {
    id: 'cvd',
    name: 'CVD (2心より合わせ)',
    desc: '単相2線式幹配線 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 27, '2.0mm': 38, '2.6mm': 49, '2.0 sq': 27, '3.5 sq': 38, '5.5 sq': 49,
      '8.0 sq': 60, '14.0 sq': 86, '22.0 sq': 110, '38.0 sq': 155, '60.0 sq': 210,
      '100.0 sq': 290, '150.0 sq': 373, '200.0 sq': 445, '250.0 sq': 510, '325.0 sq': 610
    }
  },
  {
    id: 'cvt',
    name: 'CVT (3心より合わせ)',
    desc: '三相/単三幹配線 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 25, '2.0mm': 35, '2.6mm': 46, '2.0 sq': 25, '3.5 sq': 35, '5.5 sq': 46,
      '8.0 sq': 51, '14.0 sq': 73, '22.0 sq': 96, '38.0 sq': 132, '60.0 sq': 181,
      '100.0 sq': 253, '150.0 sq': 324, '200.0 sq': 385, '250.0 sq': 445, '325.0 sq': 528
    }
  },
  {
    id: 'cvq',
    name: 'CVQ (4心より合わせ)',
    desc: '4線式配線 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 24, '2.0mm': 33, '2.6mm': 43, '2.0 sq': 24, '3.5 sq': 33, '5.5 sq': 43,
      '8.0 sq': 48, '14.0 sq': 69, '22.0 sq': 91, '38.0 sq': 125, '60.0 sq': 171,
      '100.0 sq': 240, '150.0 sq': 307, '200.0 sq': 365, '250.0 sq': 421, '325.0 sq': 501
    }
  },
  {
    id: 'cv_2c',
    name: 'CV-2C (シース2心)',
    desc: '一括シース丸形2心 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 26, '2.0mm': 36, '2.6mm': 46, '2.0 sq': 26, '3.5 sq': 36, '5.5 sq': 46,
      '8.0 sq': 57, '14.0 sq': 81, '22.0 sq': 105, '38.0 sq': 148, '60.0 sq': 198,
      '100.0 sq': 280, '150.0 sq': 356, '200.0 sq': 423, '250.0 sq': 489, '325.0 sq': 583
    }
  },
  {
    id: 'cv_3c',
    name: 'CV-3C (シース3心)',
    desc: '一括シース丸形3心 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 24, '2.0mm': 33, '2.6mm': 40, '2.0 sq': 24, '3.5 sq': 33, '5.5 sq': 40,
      '8.0 sq': 48, '14.0 sq': 69, '22.0 sq': 91, '38.0 sq': 126, '60.0 sq': 170,
      '100.0 sq': 242, '150.0 sq': 308, '200.0 sq': 368, '250.0 sq': 423, '325.0 sq': 501
    }
  },
  {
    id: 'cv_4c',
    name: 'CV-4C (シース4心)',
    desc: '一括シース丸形4心 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 22, '2.0mm': 30, '2.6mm': 38, '2.0 sq': 22, '3.5 sq': 30, '5.5 sq': 38,
      '8.0 sq': 45, '14.0 sq': 65, '22.0 sq': 86, '38.0 sq': 119, '60.0 sq': 161,
      '100.0 sq': 229, '150.0 sq': 291, '200.0 sq': 349, '250.0 sq': 402, '325.0 sq': 475
    }
  },
  {
    id: 'mlfc',
    name: 'MLFC (難燃ポリフレックス)',
    desc: '盤内・端末配線用 (許容温度 90℃)',
    maxTemp: 90,
    tempCategory: '90',
    limits: {
      '1.6mm': 33, '2.0mm': 44, '2.6mm': 57, '2.0 sq': 33, '3.5 sq': 44, '5.5 sq': 57,
      '8.0 sq': 78, '14.0 sq': 110, '22.0 sq': 145, '38.0 sq': 205, '60.0 sq': 275,
      '100.0 sq': 385, '150.0 sq': 495, '200.0 sq': 605, '250.0 sq': 700, '325.0 sq': 835
    }
  },
  {
    id: 'ow',
    name: 'OW (屋外用架空ビニル)',
    desc: '屋外空調架空線 (高放熱)',
    maxTemp: 60,
    tempCategory: 'outdoor',
    limits: {
      '0.2 sq (2.5A)': 3.5, '0.3 sq (5A)': 7.0, '0.5 sq (5A)': 7.0, '0.75 sq (6.6A)': 9.0,
      '1.25 sq (11.6A)': 16.0, '1.6mm': 32, '2.0mm': 42, '2.6mm': 58, '2.0 sq': 32,
      '3.0 sq (30A)': 40.0, '3.5 sq': 44, '5.0 sq (40A)': 55.0, '5.5 sq': 58, '8.0 sq': 75,
      '14.0 sq': 107, '22.0 sq': 140
    }
  },
  {
    id: 'dv',
    name: 'DV (引込用ビニル)',
    desc: '建物引込部空中配線 (高放熱)',
    maxTemp: 60,
    tempCategory: 'outdoor',
    limits: {
      '0.2 sq (2.5A)': 3.5, '0.3 sq (5A)': 7.0, '0.5 sq (5A)': 7.0, '0.75 sq (6.6A)': 9.0,
      '1.25 sq (11.6A)': 16.0, '1.6mm': 30, '2.0mm': 39, '2.6mm': 54, '2.0 sq': 30,
      '3.0 sq (30A)': 38.0, '3.5 sq': 41, '5.0 sq (40A)': 52.0, '5.5 sq': 54, '8.0 sq': 70,
      '14.0 sq': 99, '22.0 sq': 130
    }
  },
  {
    id: 'vct',
    name: 'VCT (ビニルキャブタイヤケーブル)',
    desc: '移動用機器・延長ケーブル用 (※屋内固定配線不可)',
    maxTemp: 60,
    tempCategory: '60',
    isIndoorWiringForbidden: true,
    warningMessage: 'VCTは機器への電源供給・延長用です。壁内や天井などの屋内固定配線には使用できません（電気設備技術基準）。',
    limits: {
      '0.75 sq (6.6A)': 7, '1.25 sq (11.6A)': 12, '2.0 sq': 19, '3.5 sq': 27,
      '5.5 sq': 37, '8.0 sq': 49, '14.0 sq': 69, '22.0 sq': 88
    }
  },
  {
    id: 'vctf',
    name: 'VCTF / VCT-F (ビニルキャブタイヤコード)',
    desc: '小型機器・延長コード用 (※屋内固定配線不可)',
    maxTemp: 60,
    tempCategory: '60',
    isIndoorWiringForbidden: true,
    warningMessage: 'VCTFは小型機器電源供給・延長コード専用です。壁内等の固定配線には使用できません（内線規程）。',
    limits: {
      '0.2 sq (2.5A)': 2.5, '0.3 sq (5A)': 5.0, '0.5 sq (5A)': 5.0,
      '0.75 sq (6.6A)': 7, '1.25 sq (11.6A)': 12, '2.0 sq': 17
    }
  },
  {
    id: 'vff',
    name: 'VFF (小判コード / 平形コード)',
    desc: '器具コード・家庭用延長コード (※屋内固定配線不可)',
    maxTemp: 60,
    tempCategory: '60',
    isIndoorWiringForbidden: true,
    warningMessage: '小判コード(VFF)は器具電源・延長用です。壁内や造営物への固定配線には使用できません。',
    limits: {
      '0.2 sq (2.5A)': 2.5, '0.3 sq (5A)': 5.0, '0.5 sq (5A)': 5.0,
      '0.75 sq (6.6A)': 7, '1.25 sq (11.6A)': 12, '2.0 sq': 17
    }
  }
];

export const CABLE_TEMP_GROUPS = [
  { label: '60℃ (低熱・標準室内配線)', items: ['vv', 'vvr', 'iv'] },
  { label: '75℃ (中熱・エコ・耐熱)', items: ['em_eef', 'em_ief', 'hiv'] },
  { label: '90℃ (高耐熱・大容量幹配線)', items: ['cv', 'cvd', 'cvt', 'cvq', 'cv_2c', 'cv_3c', 'cv_4c', 'mlfc'] },
  { label: '屋外空中架空 (放熱良好)', items: ['ow', 'dv'] },
  { label: '機器電源・延長コード (※屋内固定配線不可)', items: ['vct', 'vctf', 'vff'] }
];

export const SYSTEM_DEFINITIONS: SystemType[] = [
  { id: '1P2W', label: '単相2線式 / 直流2線', defaultVoltage: 100, k: 35.6, kFactor: 2.0 },
  { id: '1P3W_100V', label: '単相3線式 (100V負荷)', defaultVoltage: 100, k: 17.8, kFactor: 1.0 },
  { id: '1P3W_200V', label: '単相3線式 (200V負荷)', defaultVoltage: 200, k: 35.6, kFactor: 2.0 },
  { id: '3P3W', label: '三相3線式 (線間)', defaultVoltage: 200, k: 30.8, kFactor: 1.732 }
];

export const MOTOR_SPECS: MotorSpec[] = [
  { kw: 0.2,  amp: 1.8,  defaultCosTheta: 0.80 },
  { kw: 0.4,  amp: 3.2,  defaultCosTheta: 0.80 },
  { kw: 0.75, amp: 4.8,  defaultCosTheta: 0.80 },
  { kw: 1.5,  amp: 8.0,  defaultCosTheta: 0.80 },
  { kw: 2.2,  amp: 11.1, defaultCosTheta: 0.80 },
  { kw: 3.7,  amp: 17.4, defaultCosTheta: 0.85 },
  { kw: 5.5,  amp: 26.0, defaultCosTheta: 0.85 },
  { kw: 7.5,  amp: 34.0, defaultCosTheta: 0.85 },
  { kw: 11.0, amp: 48.0, defaultCosTheta: 0.88 },
  { kw: 15.0, amp: 65.0, defaultCosTheta: 0.88 }
];

export const CABLE_SPECS: CableSpec[] = [
  {
    size: '0.75 sq',
    area: 0.75,
    r: 24.4,     // 導体抵抗 (Ω/km, 20℃)
    x: 0.110,    // リアクタンス (Ω/km)
    baseAllowAmp: {
      vv: 7, vvr: 7, iv: 7, em_eef: 8, em_ief: 8, hiv: 8,
      cv: 0, cvd: 0, cvt: 0, cvq: 0, cv_2c: 0, cv_3c: 0, cv_4c: 0, mlfc: 0,
      ow: 9, dv: 9, vct: 7, vctf: 7, vff: 7
    }
  },
  {
    size: '1.25 sq',
    area: 1.25,
    r: 14.7,     // 導体抵抗 (Ω/km, 20℃)
    x: 0.110,    // リアクタンス (Ω/km)
    baseAllowAmp: {
      vv: 12, vvr: 12, iv: 12, em_eef: 13, em_ief: 13, hiv: 13,
      cv: 0, cvd: 0, cvt: 0, cvq: 0, cv_2c: 0, cv_3c: 0, cv_4c: 0, mlfc: 0,
      ow: 16, dv: 16, vct: 12, vctf: 12, vff: 12
    }
  },
  {
    size: '1.6mm',
    area: 2.01,
    r: 8.92,
    x: 0.106,
    baseAllowAmp: {
      vv: 18, vvr: 18, iv: 27, em_eef: 21, em_ief: 31, hiv: 31,
      cv: 33, cvd: 27, cvt: 25, cvq: 24, cv_2c: 26, cv_3c: 24, cv_4c: 22, mlfc: 33,
      ow: 32, dv: 30, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '2.0mm',
    area: 3.14,
    r: 5.65,
    x: 0.101,
    baseAllowAmp: {
      vv: 24, vvr: 24, iv: 35, em_eef: 28, em_ief: 40, hiv: 40,
      cv: 44, cvd: 38, cvt: 35, cvq: 33, cv_2c: 36, cv_3c: 33, cv_4c: 30, mlfc: 44,
      ow: 42, dv: 39, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '2.6mm',
    area: 5.31,
    r: 3.33,
    x: 0.095,
    baseAllowAmp: {
      vv: 35, vvr: 35, iv: 48, em_eef: 40, em_ief: 55, hiv: 55,
      cv: 57, cvd: 49, cvt: 46, cvq: 43, cv_2c: 46, cv_3c: 40, cv_4c: 38, mlfc: 57,
      ow: 58, dv: 54, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '2.0 sq',
    area: 2.0,
    r: 9.24,
    x: 0.106,
    baseAllowAmp: {
      vv: 19, vvr: 19, iv: 27, em_eef: 22, em_ief: 31, hiv: 31,
      cv: 33, cvd: 27, cvt: 25, cvq: 24, cv_2c: 26, cv_3c: 24, cv_4c: 22, mlfc: 33,
      ow: 32, dv: 30, vct: 19, vctf: 17, vff: 17
    }
  },
  {
    size: '3.5 sq',
    area: 3.5,
    r: 5.20,
    x: 0.101,
    baseAllowAmp: {
      vv: 27, vvr: 27, iv: 37, em_eef: 31, em_ief: 42, hiv: 42,
      cv: 44, cvd: 38, cvt: 35, cvq: 33, cv_2c: 36, cv_3c: 33, cv_4c: 30, mlfc: 44,
      ow: 44, dv: 41, vct: 27, vctf: 0, vff: 0
    }
  },
  {
    size: '5.5 sq',
    area: 5.5,
    r: 3.79,
    x: 0.101,
    baseAllowAmp: {
      vv: 37, vvr: 37, iv: 49, em_eef: 43, em_ief: 56, hiv: 56,
      cv: 57, cvd: 49, cvt: 46, cvq: 43, cv_2c: 46, cv_3c: 40, cv_4c: 38, mlfc: 57,
      ow: 58, dv: 54, vct: 37, vctf: 0, vff: 0
    }
  },
  {
    size: '8.0 sq',
    area: 8.0,
    r: 2.31,
    x: 0.097,
    baseAllowAmp: {
      vv: 49, vvr: 49, iv: 61, em_eef: 56, em_ief: 70, hiv: 70,
      cv: 78, cvd: 60, cvt: 51, cvq: 48, cv_2c: 57, cv_3c: 48, cv_4c: 45, mlfc: 78,
      ow: 75, dv: 70, vct: 49, vctf: 0, vff: 0
    }
  },
  {
    size: '14.0 sq',
    area: 14.0,
    r: 1.32,
    x: 0.093,
    baseAllowAmp: {
      vv: 69, vvr: 69, iv: 88, em_eef: 79, em_ief: 101, hiv: 101,
      cv: 110, cvd: 86, cvt: 73, cvq: 69, cv_2c: 81, cv_3c: 69, cv_4c: 65, mlfc: 110,
      ow: 107, dv: 99, vct: 69, vctf: 0, vff: 0
    }
  },
  {
    size: '22.0 sq',
    area: 22.0,
    r: 0.84,
    x: 0.089,
    baseAllowAmp: {
      vv: 80, vvr: 80, iv: 115, em_eef: 105, em_ief: 132, hiv: 132,
      cv: 145, cvd: 110, cvt: 96, cvq: 91, cv_2c: 105, cv_3c: 91, cv_4c: 86, mlfc: 145,
      ow: 140, dv: 130, vct: 88, vctf: 0, vff: 0
    }
  },
  {
    size: '38.0 sq',
    area: 38.0,
    r: 0.49,
    x: 0.086,
    baseAllowAmp: {
      vv: 115, vvr: 115, iv: 162, em_eef: 148, em_ief: 186, hiv: 186,
      cv: 205, cvd: 155, cvt: 132, cvq: 125, cv_2c: 148, cv_3c: 126, cv_4c: 119, mlfc: 205,
      ow: 190, dv: 180, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '60.0 sq',
    area: 60.0,
    r: 0.31,
    x: 0.083,
    baseAllowAmp: {
      vv: 150, vvr: 150, iv: 217, em_eef: 198, em_ief: 249, hiv: 249,
      cv: 275, cvd: 210, cvt: 181, cvq: 171, cv_2c: 198, cv_3c: 170, cv_4c: 161, mlfc: 275,
      ow: 250, dv: 235, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '100.0 sq',
    area: 100.0,
    r: 0.18,
    x: 0.080,
    baseAllowAmp: {
      vv: 205, vvr: 205, iv: 298, em_eef: 272, em_ief: 342, hiv: 342,
      cv: 385, cvd: 290, cvt: 253, cvq: 240, cv_2c: 280, cv_3c: 242, cv_4c: 229, mlfc: 385,
      ow: 345, dv: 325, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '150.0 sq',
    area: 150.0,
    r: 0.12,
    x: 0.078,
    baseAllowAmp: {
      vv: 260, vvr: 260, iv: 383, em_eef: 350, em_ief: 440, hiv: 440,
      cv: 495, cvd: 373, cvt: 324, cvq: 307, cv_2c: 356, cv_3c: 308, cv_4c: 291, mlfc: 495,
      ow: 440, dv: 415, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '200.0 sq',
    area: 200.0,
    r: 0.09,
    x: 0.077,
    baseAllowAmp: {
      vv: 310, vvr: 310, iv: 457, em_eef: 417, em_ief: 525, hiv: 525,
      cv: 605, cvd: 445, cvt: 385, cvq: 365, cv_2c: 423, cv_3c: 368, cv_4c: 349, mlfc: 605,
      ow: 525, dv: 495, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '250.0 sq',
    area: 250.0,
    r: 0.07,
    x: 0.076,
    baseAllowAmp: {
      vv: 355, vvr: 355, iv: 525, em_eef: 479, em_ief: 603, hiv: 603,
      cv: 700, cvd: 510, cvt: 445, cvq: 421, cv_2c: 489, cv_3c: 423, cv_4c: 402, mlfc: 700,
      ow: 600, dv: 565, vct: 0, vctf: 0, vff: 0
    }
  },
  {
    size: '325.0 sq',
    area: 325.0,
    r: 0.05,
    x: 0.075,
    baseAllowAmp: {
      vv: 420, vvr: 420, iv: 622, em_eef: 568, em_ief: 714, hiv: 714,
      cv: 835, cvd: 610, cvt: 528, cvq: 501, cv_2c: 583, cv_3c: 501, cv_4c: 475, mlfc: 835,
      ow: 710, dv: 670, vct: 0, vctf: 0, vff: 0
    }
  }
];

export const REDUCTION_FACTORS: Record<InstallationType, number> = {
  conduit_3: 0.70,
  conduit_4: 0.63,
  ceiling_open: 1.00,
  staple_surface: 0.85
};

export const BREAKER_SIZES = [15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300];

export const THREE_PHASE_BREAKER_SIZES = [
  20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300, 400
];

export const MOTOR_CAPACITOR_TABLE_200V: CapacitorTableEntry[] = [
  { kw: 0.2,  uf50Hz: 15,  kvar50Hz: 0.19, uf60Hz: 10,  kvar60Hz: 0.15 },
  { kw: 0.4,  uf50Hz: 20,  kvar50Hz: 0.25, uf60Hz: 15,  kvar60Hz: 0.23 },
  { kw: 0.75, uf50Hz: 30,  kvar50Hz: 0.38, uf60Hz: 20,  kvar60Hz: 0.30 },
  { kw: 1.0,  uf50Hz: 30,  kvar50Hz: 0.38, uf60Hz: 20,  kvar60Hz: 0.30 },
  { kw: 1.1,  uf50Hz: 30,  kvar50Hz: 0.38, uf60Hz: 20,  kvar60Hz: 0.30 },
  { kw: 1.5,  uf50Hz: 40,  kvar50Hz: 0.50, uf60Hz: 30,  kvar60Hz: 0.45 },
  { kw: 2.0,  uf50Hz: 50,  kvar50Hz: 0.63, uf60Hz: 40,  kvar60Hz: 0.60 },
  { kw: 2.2,  uf50Hz: 50,  kvar50Hz: 0.63, uf60Hz: 40,  kvar60Hz: 0.60 },
  { kw: 3.0,  uf50Hz: 50,  kvar50Hz: 0.63, uf60Hz: 40,  kvar60Hz: 0.60 },
  { kw: 3.7,  uf50Hz: 75,  kvar50Hz: 0.94, uf60Hz: 50,  kvar60Hz: 0.75 },
  { kw: 4.0,  uf50Hz: 75,  kvar50Hz: 0.94, uf60Hz: 50,  kvar60Hz: 0.75 },
  { kw: 5.0,  uf50Hz: 100, kvar50Hz: 1.26, uf60Hz: 75,  kvar60Hz: 1.13 },
  { kw: 5.5,  uf50Hz: 100, kvar50Hz: 1.26, uf60Hz: 75,  kvar60Hz: 1.13 },
  { kw: 7.5,  uf50Hz: 150, kvar50Hz: 1.88, uf60Hz: 100, kvar60Hz: 1.51 },
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
  { kw: 55.0, uf50Hz: 900, kvar50Hz: 11.3, uf60Hz: 750, kvar60Hz: 11.3 }
];

// ==========================================
// 4. 許容電流・動的補正計算エンジン関数群
// ==========================================

export function calculateK1(maxTemp: number, ambientTemp: number): number {
  if (ambientTemp >= maxTemp) {
    return 0;
  }
  if (ambientTemp <= 30) {
    return 1.0;
  }
  return Math.sqrt((maxTemp - ambientTemp) / (maxTemp - 30));
}

export function calculateK2(wireCount: number, isRackSpaced: boolean = false): number {
  if (isRackSpaced || wireCount <= 0) {
    return 1.0;
  }
  const entry = REDUCTION_FACTOR_TABLE.find(
    (item) => wireCount >= item.minWires && wireCount <= item.maxWires
  );
  return entry ? entry.factor : 0.70;
}

export function calculateAllowableCurrent(params: {
  baseAllowAmp: number;
  maxTemp: number;
  ambientTemp: number;
  wireCount: number;
  parallelCount?: number;
  isRackSpaced?: boolean;
}): {
  k1: number;
  k2: number;
  singleAllowAmp: number;
  totalAllowAmp: number;
} {
  const {
    baseAllowAmp,
    maxTemp,
    ambientTemp,
    wireCount,
    parallelCount = 1,
    isRackSpaced = false
  } = params;

  const k1 = calculateK1(maxTemp, ambientTemp);
  const k2 = calculateK2(wireCount, isRackSpaced);

  const singleAllowAmp = Math.floor(baseAllowAmp * k1 * k2);
  const totalAllowAmp = singleAllowAmp * Math.max(1, parallelCount);

  return {
    k1: Math.round(k1 * 100) / 100,
    k2,
    singleAllowAmp,
    totalAllowAmp
  };
}