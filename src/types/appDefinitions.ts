// ==========================================
// 1. アプリ状態・UIイベント型定義
// ==========================================

/** メイン表示モード */
export type AppMode = 'normal' | 'reversed' | 'motor';

/** 機器入力モード */
export type EquipmentInputMode = 'device_watt' | 'device_amp' | 'breaker_limit';

/** 逆算計算入力モード */
export type CalculationInputMode = 'amp' | 'watt';

/** 負荷種別 */
export type LoadType = 'general' | 'motor';

/** 敷設方式 */
export type InstallationType = 'conduit_3' | 'conduit_4' | 'ceiling_open' | 'staple_surface';

/** ケーブル種別コード */
export type CableTypeCode = 'VV' | 'IV' | 'CV';


// ==========================================
// 2. Vue コンポーネント Props / Emits インターフェース
// ==========================================

/** WireSizeSelect.vue */
export interface WireSizeSelectProps {
  selectedWireName: string;
  isOpen: boolean;
}

export interface WireSizeSelectEmits {
  (e: 'update:selectedWireName', name: string): void;
  (e: 'open'): void;
  (e: 'close'): void;
}

/** WireTypeSelect.vue */
export interface WireTypeSelectProps {
  modelValue: string;
}

export interface WireTypeSelectEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change'): void;
}

/** ResultCard.vue */
export interface ResultCardProps {
  maxLen: number;
  isOverCurrent: boolean;
}

/** ReversedResult.vue */
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

/** 電線種別（詳細） */
export interface CableType {
  id: string;
  name: string;
  desc: string;
  limits: Record<string, number>;
}

/** 電線サイズ */
export interface WireSize {
  name: string;
  area: number;
  amp?: number;
}

/** 配線方式統合定義 */
export interface SystemType {
  id: string;
  label: string;
  defaultVoltage: number;
  k: number;       // 許容配線長計算用定数
  kFactor: number; // 逆算用相数・配線方式倍率
}

/** モータースペック */
export interface MotorSpec {
  kw: number;
  amp: number;
  defaultCosTheta: number;
}

/** 電線スペック */
export interface CableSpec {
  size: string;
  area: number;
  r: number;
  x: number;
  baseAllowAmp: Record<CableTypeCode, number>;
}

/** 逆算選定結果アイテム */
export interface AvailableWireResult {
  wireName: string;
  area: number;
  maxAmpereByDrop: number;
  allowAmpereByHeat: number;
  effectiveMaxAmp: number;
  isOkForLoad: boolean;
}

/** 送る側ブレーカー判定結果 */
export interface BreakerStatusResult {
  is20AOk: boolean;
  currentLoad: number;
  recommendedBreaker: number;
  message: string;
}

/** 計算エラー・警告メッセージ */
export interface CalculationIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  title: string;
  message: string;
}


// ==========================================
// 4. 定数・マスタデータ定義
// ==========================================

/** 電線サイズ一覧 (WireSizeSelect / useWireSize) */
export const WIRE_SIZES: WireSize[] = [
  { name: '0.2 sq (2.5A)', area: 0.2, amp: 2.5 },
  { name: '0.3 sq (5A)', area: 0.3, amp: 5.0 },
  { name: '0.5 sq (5A)', area: 0.5, amp: 5.0 },
  { name: '0.75 sq (6.6A)', area: 0.75, amp: 6.6 },
  { name: '1.25 sq (11.6A)', area: 1.25, amp: 11.6 },
  { name: '1.6mm', area: 2.01, amp: 27 },
  { name: '2.0mm', area: 3.14, amp: 35 },
  { name: '2.6mm', area: 5.31, amp: 48 },
  { name: '2.0 sq', area: 2.0, amp: 16.6 },
  { name: '3.0 sq (30A)', area: 3.0, amp: 30.0 },
  { name: '3.5 sq', area: 3.5, amp: 37 },
  { name: '5.0 sq (40A)', area: 5.0, amp: 40.0 },
  { name: '5.5 sq', area: 5.5, amp: 49 },
  { name: '8.0 sq', area: 8.0, amp: 61 },
  { name: '14.0 sq', area: 14.0, amp: 88 },
  { name: '22.0 sq', area: 22.0, amp: 80.0 }
];

/** 電線種別一覧 (WireTypeSelect / useWire) */
export const CABLE_TYPES: CableType[] = [
  {
    id: 'iv',
    name: 'IV (ビニル絶縁電線)',
    desc: '屋内配線用 絶縁電線 (耐熱 60℃)',
    limits: {
      '0.2 sq (2.5A)': 2.5,
      '0.3 sq (5A)': 5.0,
      '0.5 sq (5A)': 5.0,
      '0.75 sq (6.6A)': 6.6,
      '1.25 sq (11.6A)': 11.6,
      '1.6mm': 27,
      '2.0mm': 35,
      '2.6mm': 48,
      '2.0 sq': 27,
      '3.0 sq (30A)': 30.0,
      '3.5 sq': 37,
      '5.0 sq (40A)': 40.0,
      '5.5 sq': 49,
      '8.0 sq': 61,
      '14.0 sq': 88,
      '22.0 sq': 115
    }
  },
  {
    id: 'vvf',
    name: 'VVF / VVR (VV)',
    desc: 'ビニル外装平形/丸形ケーブル (耐熱 60℃)',
    limits: {
      '0.2 sq (2.5A)': 2.5,
      '0.3 sq (5A)': 5.0,
      '0.5 sq (5A)': 5.0,
      '0.75 sq (6.6A)': 6.6,
      '1.25 sq (11.6A)': 11.6,
      '1.6mm': 18,
      '2.0mm': 24,
      '2.6mm': 35,
      '2.0 sq': 19,
      '3.0 sq (30A)': 30.0,
      '3.5 sq': 27,
      '5.0 sq (40A)': 40.0,
      '5.5 sq': 37,
      '8.0 sq': 49,
      '14.0 sq': 69,
      '22.0 sq': 80.0
    }
  },
  {
    id: 'cv',
    name: 'CV / CVT / CVR',
    desc: '架橋ポリエチレン (耐熱 90℃)',
    limits: {
      '0.2 sq (2.5A)': 2.5,
      '0.3 sq (5A)': 5.0,
      '0.5 sq (5A)': 5.0,
      '0.75 sq (6.6A)': 6.6,
      '1.25 sq (11.6A)': 11.6,
      '1.6mm': 24,
      '2.0mm': 33,
      '2.6mm': 47,
      '2.0 sq': 24,
      '3.0 sq (30A)': 30.0,
      '3.5 sq': 33,
      '5.0 sq (40A)': 40.0,
      '5.5 sq': 46,
      '8.0 sq': 61,
      '14.0 sq': 88,
      '22.0 sq': 150
    }
  }
];

/** 配線方式統合マスタ (CablingSelect / Home / useCabling / useReversedCallc) */
export const SYSTEM_DEFINITIONS: SystemType[] = [
  { id: '1P2W', label: '単相2線式 / 直流2線', defaultVoltage: 100, k: 35.6, kFactor: 2.0 },
  { id: '1P3W_100V', label: '単相3線式 (100V負荷)', defaultVoltage: 100, k: 17.8, kFactor: 1.0 },
  { id: '1P3W_200V', label: '単相3線式 (200V負荷)', defaultVoltage: 200, k: 35.6, kFactor: 2.0 },
  { id: '3P3W', label: '三相3線式 (線間)', defaultVoltage: 200, k: 30.8, kFactor: 1.732 }
];

/** 三相モーター規約スペック一覧 (MotorCalc / Home / useReversedCallc) */
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

/** 電線物理パラメータ＆許容電流スペック (useReversedCallc) */
export const CABLE_SPECS: CableSpec[] = [
  { size: '0.2 sq (2.5A)', area: 0.2,  r: 89.5, x: 0.12, baseAllowAmp: { VV: 2.5, IV: 2.5, CV: 2.5 } },
  { size: '0.3 sq (5A)',   area: 0.3,  r: 60.0, x: 0.12, baseAllowAmp: { VV: 5.0, IV: 5.0, CV: 5.0 } },
  { size: '0.5 sq (5A)',   area: 0.5,  r: 36.7, x: 0.11, baseAllowAmp: { VV: 5.0, IV: 5.0, CV: 5.0 } },
  { size: '0.75 sq (6.6A)',area: 0.75, r: 24.4, x: 0.11, baseAllowAmp: { VV: 6.6, IV: 6.6, CV: 6.6 } },
  { size: '1.25 sq (11.6A)',area: 1.25,r: 14.7, x: 0.11, baseAllowAmp: { VV: 11.6, IV: 11.6, CV: 11.6 } },
  { size: '1.6mm',         area: 2.01, r: 8.92, x: 0.106, baseAllowAmp: { VV: 18, IV: 27, CV: 24 } },
  { size: '2.0mm',         area: 3.14, r: 5.65, x: 0.101, baseAllowAmp: { VV: 24, IV: 35, CV: 33 } },
  { size: '2.6mm',         area: 5.31, r: 3.33, x: 0.095, baseAllowAmp: { VV: 35, IV: 48, CV: 47 } },
  { size: '2.0 sq',        area: 2.0,  r: 9.24, x: 0.106, baseAllowAmp: { VV: 19, IV: 27, CV: 24 } },
  { size: '3.0 sq (30A)',  area: 3.0,  r: 6.10, x: 0.102, baseAllowAmp: { VV: 30.0, IV: 30.0, CV: 30.0 } },
  { size: '3.5 sq',        area: 3.5,  r: 5.20, x: 0.101, baseAllowAmp: { VV: 27, IV: 37, CV: 33 } },
  { size: '5.0 sq (40A)',  area: 5.0,  r: 3.90, x: 0.101, baseAllowAmp: { VV: 40.0, IV: 40.0, CV: 40.0 } },
  { size: '5.5 sq',        area: 5.5,  r: 3.79, x: 0.101, baseAllowAmp: { VV: 37, IV: 49, CV: 46 } },
  { size: '8.0 sq',        area: 8.0,  r: 2.31, x: 0.097, baseAllowAmp: { VV: 49, IV: 61, CV: 61 } },
  { size: '14.0 sq',       area: 14.0, r: 1.32, x: 0.093, baseAllowAmp: { VV: 69, IV: 88, CV: 88 } },
  { size: '22.0 sq',       area: 22.0, r: 0.84, x: 0.089, baseAllowAmp: { VV: 80, IV: 115, CV: 150 } }
];

/** 敷設方式電流低減係数 (useReversedCallc) */
export const REDUCTION_FACTORS: Record<InstallationType, number> = {
  conduit_3: 0.70,
  conduit_4: 0.63,
  ceiling_open: 1.00,
  staple_surface: 0.85
};

/** ブレーカー標準容量一覧 */
export const BREAKER_SIZES = [15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300];