// ==========================================
// 1. アプリ状態・UIイベント型定義
// ==========================================

export type AppMode = 'normal' | 'reversed' | 'motor';
export type EquipmentInputMode = 'device_watt' | 'device_amp' | 'breaker_limit';
export type CalculationInputMode = 'amp' | 'watt';
export type LoadType = 'general' | 'motor';
export type InstallationType = 'conduit_3' | 'conduit_4' | 'ceiling_open' | 'staple_surface';

/** ケーブル種別コード (小文字統一) */
export type CableTypeCode = 
  | 'vv' 
  | 'vvr' 
  | 'iv' 
  | 'em_eef' 
  | 'em_ief' 
  | 'hiv' 
  | 'cv' 
  | 'cvt' 
  | 'ow' 
  | 'dv';

export type EnvironmentType = 'normal' | 'enclosure' | 'wet';

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
  recommendedMicroFarad: number;
  improvedPowerFactor: number;
  dischargeResistorNote: string;
}

// ==========================================
// 2. Vue コンポーネント Props / Emits インターフェース
// ==========================================

export interface WireSizeSelectProps {
  selectedWireName: string;
  isOpen: boolean;
}

export interface WireSizeSelectEmits {
  (e: 'update:selectedWireName', name: string): void;
  (e: 'open'): void;
  (e: 'close'): void;
}

export interface WireTypeSelectProps {
  modelValue: string;
}

export interface WireTypeSelectEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change'): void;
}

export interface ResultCardProps {
  maxLen: number;
  isOverCurrent: boolean;
}

export interface ReversedResultProps {
  voltage: number;
  targetPercent: number;
  inputMode: CalculationInputMode;
  loadWatt: number;
  loadCurrent: number;
  oneWayDistance: number;
  selectedSystemId: string;
  selectedCableType: CableTypeCode;
  powerFactor: number;
  ignorePowerFactor: boolean;
  loadType: LoadType;
  motorKw: number;
  installationType: InstallationType;
  isContinuous: boolean;
}

// ==========================================
// 3. 配線・計算用 データインターフェース
// ==========================================

export interface CableType {
  id: CableTypeCode;
  name: string;
  desc: string;
  tempCategory: '60' | '75' | '90' | 'outdoor';
  limits: Record<string, number>;
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

// ==========================================
// 4. 定数・マスタデータ定義
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
  { name: '22.0 sq', area: 22.0, amp: 98 }
];

export const CABLE_TYPES: CableType[] = [
  {
    id: 'vv',
    name: 'VVF (平形ビニル)',
    desc: '標準室内配線 (許容温度 60℃)',
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
    name: 'CV (3心架橋PE)',
    desc: '高容量幹配線・丸形 (許容温度 90℃)',
    tempCategory: '90',
    limits: {
      '0.2 sq (2.5A)': 3.0, '0.3 sq (5A)': 6.0, '0.5 sq (5A)': 6.0, '0.75 sq (6.6A)': 8.0,
      '1.25 sq (11.6A)': 14.0, '1.6mm': 24, '2.0mm': 33, '2.6mm': 47, '2.0 sq': 24,
      '3.0 sq (30A)': 35.0, '3.5 sq': 33, '5.0 sq (40A)': 46.0, '5.5 sq': 46, '8.0 sq': 61,
      '14.0 sq': 88, '22.0 sq': 115
    }
  },
  {
    id: 'cvt',
    name: 'CVT (3心より合わせCV)',
    desc: '熱放散向上トリプレックス (許容温度 90℃)',
    tempCategory: '90',
    limits: {
      '0.2 sq (2.5A)': 3.2, '0.3 sq (5A)': 6.5, '0.5 sq (5A)': 6.5, '0.75 sq (6.6A)': 8.5,
      '1.25 sq (11.6A)': 15.0, '1.6mm': 27, '2.0mm': 37, '2.6mm': 52, '2.0 sq': 27,
      '3.0 sq (30A)': 38.0, '3.5 sq': 37, '5.0 sq (40A)': 50.0, '5.5 sq': 52, '8.0 sq': 69,
      '14.0 sq': 100, '22.0 sq': 132
    }
  },
  {
    id: 'ow',
    name: 'OW (屋外用架空ビニル)',
    desc: '屋外空調架空線 (高放熱)',
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
    tempCategory: 'outdoor',
    limits: {
      '0.2 sq (2.5A)': 3.5, '0.3 sq (5A)': 7.0, '0.5 sq (5A)': 7.0, '0.75 sq (6.6A)': 9.0,
      '1.25 sq (11.6A)': 16.0, '1.6mm': 30, '2.0mm': 39, '2.6mm': 54, '2.0 sq': 30,
      '3.0 sq (30A)': 38.0, '3.5 sq': 41, '5.0 sq (40A)': 52.0, '5.5 sq': 54, '8.0 sq': 70,
      '14.0 sq': 99, '22.0 sq': 130
    }
  }
];

export const CABLE_TEMP_GROUPS = [
  {
    label: '60℃ (低熱・標準室内配線)',
    items: ['vv', 'vvr', 'iv']
  },
  {
    label: '75℃ (中熱・エコ・耐熱)',
    items: ['em_eef', 'em_ief', 'hiv']
  },
  {
    label: '90℃ (高耐熱・大容量幹配線)',
    items: ['cv', 'cvt']
  },
  {
    label: '屋外空中架空 (放熱良好)',
    items: ['ow', 'dv']
  }
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
  { size: '0.2 sq (2.5A)', area: 0.2,  r: 89.5, x: 0.12, baseAllowAmp: { vv: 2.5, vvr: 2.5, iv: 2.5, em_eef: 2.8, em_ief: 2.8, hiv: 2.8, cv: 3.0, cvt: 3.2, ow: 3.5, dv: 3.5 } },
  { size: '0.3 sq (5A)',   area: 0.3,  r: 60.0, x: 0.12, baseAllowAmp: { vv: 5.0, vvr: 5.0, iv: 5.0, em_eef: 5.5, em_ief: 5.5, hiv: 5.5, cv: 6.0, cvt: 6.5, ow: 7.0, dv: 7.0 } },
  { size: '0.5 sq (5A)',   area: 0.5,  r: 36.7, x: 0.11, baseAllowAmp: { vv: 5.0, vvr: 5.0, iv: 5.0, em_eef: 5.5, em_ief: 5.5, hiv: 5.5, cv: 6.0, cvt: 6.5, ow: 7.0, dv: 7.0 } },
  { size: '0.75 sq (6.6A)',area: 0.75, r: 24.4, x: 0.11, baseAllowAmp: { vv: 6.6, vvr: 6.6, iv: 6.6, em_eef: 7.2, em_ief: 7.2, hiv: 7.2, cv: 8.0, cvt: 8.5, ow: 9.0, dv: 9.0 } },
  { size: '1.25 sq (11.6A)',area: 1.25,r: 14.7, x: 0.11, baseAllowAmp: { vv: 11.6, vvr: 11.6, iv: 11.6, em_eef: 13.0, em_ief: 13.0, hiv: 13.0, cv: 14.0, cvt: 15.0, ow: 16.0, dv: 16.0 } },
  { size: '1.6mm',         area: 2.01, r: 8.92, x: 0.106, baseAllowAmp: { vv: 18, vvr: 18, iv: 27, em_eef: 21, em_ief: 31, hiv: 31, cv: 24, cvt: 27, ow: 32, dv: 30 } },
  { size: '2.0mm',         area: 3.14, r: 5.65, x: 0.101, baseAllowAmp: { vv: 24, vvr: 24, iv: 35, em_eef: 28, em_ief: 40, hiv: 40, cv: 33, cvt: 37, ow: 42, dv: 39 } },
  { size: '2.6mm',         area: 5.31, r: 3.33, x: 0.095, baseAllowAmp: { vv: 35, vvr: 35, iv: 48, em_eef: 40, em_ief: 55, hiv: 55, cv: 47, cvt: 52, ow: 58, dv: 54 } },
  { size: '2.0 sq',        area: 2.0,  r: 9.24, x: 0.106, baseAllowAmp: { vv: 19, vvr: 19, iv: 27, em_eef: 22, em_ief: 31, hiv: 31, cv: 24, cvt: 27, ow: 32, dv: 30 } },
  { size: '3.0 sq (30A)',  area: 3.0,  r: 6.10, x: 0.102, baseAllowAmp: { vv: 30, vvr: 30, iv: 30, em_eef: 33, em_ief: 34, hiv: 34, cv: 35, cvt: 38, ow: 40, dv: 38 } },
  { size: '3.5 sq',        area: 3.5,  r: 5.20, x: 0.101, baseAllowAmp: { vv: 27, vvr: 27, iv: 37, em_eef: 31, em_ief: 42, hiv: 42, cv: 33, cvt: 37, ow: 44, dv: 41 } },
  { size: '5.0 sq (40A)',  area: 5.0,  r: 3.90, x: 0.101, baseAllowAmp: { vv: 40, vvr: 40, iv: 40, em_eef: 44, em_ief: 46, hiv: 46, cv: 46, cvt: 50, ow: 55, dv: 52 } },
  { size: '5.5 sq',        area: 5.5,  r: 3.79, x: 0.101, baseAllowAmp: { vv: 37, vvr: 37, iv: 49, em_eef: 43, em_ief: 56, hiv: 56, cv: 46, cvt: 52, ow: 58, dv: 54 } },
  { size: '8.0 sq',        area: 8.0,  r: 2.31, x: 0.097, baseAllowAmp: { vv: 49, vvr: 49, iv: 61, em_eef: 56, em_ief: 70, hiv: 70, cv: 61, cvt: 69, ow: 75, dv: 70 } },
  { size: '14.0 sq',       area: 14.0, r: 1.32, x: 0.093, baseAllowAmp: { vv: 69, vvr: 69, iv: 88, em_eef: 79, em_ief: 101, hiv: 101, cv: 88, cvt: 100, ow: 107, dv: 99 } },
  { size: '22.0 sq',       area: 22.0, r: 0.84, x: 0.089, baseAllowAmp: { vv: 80, vvr: 80, iv: 115, em_eef: 105, em_ief: 132, hiv: 132, cv: 115, cvt: 132, ow: 140, dv: 130 } }
];

export const REDUCTION_FACTORS: Record<InstallationType, number> = {
  conduit_3: 0.70,
  conduit_4: 0.63,
  ceiling_open: 1.00,
  staple_surface: 0.85
};

export const BREAKER_SIZES = [15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300];