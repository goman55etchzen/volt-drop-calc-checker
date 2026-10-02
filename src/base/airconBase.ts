import { CABLE_SPECS, type CableTypeCode } from "./cableBase";

// ==========================================
// 1. 型定義 (Types & Interfaces)
// ==========================================

export type AreaUnit = "tatami" | "sqm" | "tsubo";

export type RoomType =
  | "living"
  | "ldk"
  | "kitchen"
  | "bedroom"
  | "kids"
  | "japanese";

export type BuildingType = "wooden" | "reinforced";

export interface AcSpec {
  /** 冷房定格能力(kW) */
  capacityKw: number;
  /** 目安畳数表記 */
  tatamiStandard: string;
  /** 最小適合畳数（木造基準） */
  minTatami: number;
  /** 最大適合畳数（鉄筋基準） */
  maxTatami: number;
  /** 定格電圧 [V] */
  voltage: 100 | 200;
  /** 電源方式 */
  phase: "1P2W" | "1P3W";
  /** 定格運転電流 [A] */
  ratedCurrentA: number;
  /** 最大運転電流 [A] */
  maxCurrentA: number;
  /** 推奨専用回路ブレーカー容量 [A] */
  breakerAmp: number;
  /** ブレーカー極数 */
  breakerPoles: string;
  /** 推奨電線サイズ */
  recommendedWireSize: string;
  /** 配線計算連携用ケーブル種別 */
  cableTypeCode: CableTypeCode;
}

export interface AirconInputParams {
  /** 面積数値 */
  areaValue: number;
  /** 面積単位 */
  unit?: AreaUnit;
  /** 部屋種別 */
  roomType?: RoomType;
  /** 建物構造 */
  buildingType?: BuildingType;
  /** 在室人数 */
  personCount?: number;
  /** 日当たり・大開口窓 */
  hasStrongSunlight?: boolean;
  /** 最上階・屋根直下 */
  isTopFloor?: boolean;
  /** 吹き抜け・高天井 */
  hasHighCeiling?: boolean;
  /** 基準許容電圧降下率 (%) ※デフォルト 2.0% */
  targetVoltageDropRatio?: number;
  /** 指定配線長 [m]（オプション指定） */
  wiringDistanceMeters?: number;
}

/** 電圧降下連携による最大亘長（許容限界長）計算結果 */
export interface AirconMaxDistanceResult {
  /** 適用電線サイズ名 */
  wireSize: string;
  /** 断面積 [mm^2] */
  crossSectionArea: number;
  /** 設計電流 [A] (maxCurrentA) */
  currentA: number;
  /** 許容電圧降下率 [%] */
  dropRatioPercent: number;
  /** 許容電圧降下値 [V] */
  allowableDropVolts: number;
  /** 基準降下率(2.0%)における最大亘長 [m] */
  maxDistanceMeters: number;
  /** 3.0% 降下時における最大亘長 [m] */
  maxDistance3PercentMeters: number;
  /** 計算に関する注記 */
  note: string;
}

/** 指定配線長における電圧降下検証結果 */
export interface AirconVoltageDropCheckResult {
  /** 配線長 [m] */
  distanceMeters: number;
  /** 適用電線サイズ */
  wireSize: string;
  /** 算術電圧降下 [V] */
  dropVolts: number;
  /** 電圧降下率 [%] */
  dropRatioPercent: number;
  /** 2.0%以内クリア判定 */
  isOk2Percent: boolean;
  /** 3.0%以内クリア判定 */
  isOk3Percent: boolean;
  /** 評価判定メッセージ */
  statusNote: string;
}

/** 配線長に応じた必要ケーブル選定結果 */
export interface AirconRequiredWireSelectionResult {
  /** 対象配線長 [m] */
  distanceMeters: number;
  /** 目標電圧降下率 [%] */
  targetDropRatio: number;
  /** 必要最小断面積 [mm^2] */
  requiredArea: number;
  /** 選定電線サイズ名（例: "2.0mm", "3.5sq"） */
  selectedWireSize: string;
  /** 選定電線断面積 [mm^2] */
  selectedArea: number;
  /** 選定電線での実際の電圧降下 [V] */
  actualDropVolts: number;
  /** 選定電線での実際の電圧降下率 [%] */
  actualDropRatio: number;
  /** 判定コメント */
  selectionNote: string;
}

export interface AirconSelectionResult {
  /** 補正後実効畳数 */
  effectiveTatami: number;
  /** 換算後基本畳数 */
  baseTatami: number;
  /** 人熱による加算熱負荷 [kW] */
  personHeatLoadKw: number;
  /** 人熱による換算畳数加算 */
  personHeatTatami: number;
  /** 選定されたエアコンスペック */
  selectedSpec: AcSpec;
  /** 最大スペック超過フラグ */
  isOverCapacity: boolean;
  /** 電圧降下連携による最大亘長結果 */
  maxDistanceInfo: AirconMaxDistanceResult;
  /** 配線長が指定されている場合の電圧降下チェック結果 */
  voltageDropCheckInfo?: AirconVoltageDropCheckResult;
  /** 配線長に応じた最適なケーブル選定結果 */
  requiredWireSelectionInfo?: AirconRequiredWireSelectionResult;
  /** 推奨コメント */
  recommendationNote: string;
  /** 計算根拠メッセージ一覧 */
  breakdownNotes: string[];
}

/** 
 * 配線計算（電圧降下・許容電流計算）連携用統一ペイロード
 */
export interface AirconCableSelectionPayload {
  cableType: CableTypeCode;
  wireSize: string;
  voltage: number;
  systemId: string;
  currentA: number;
  ratedCurrentA: number;
  maxCurrentA: number;
  breakerAmp: number;
  breakerPoles: string;
  capacityKw: number;
  tatamiStandard: string;
  /** 電圧降下基準による最大亘長 [m]（エアコン側の参考値。正は配線計算側 CableBase） */
  maxDistanceMeters: number;
  /** 限界長算出に使った許容電圧降下率 [%] */
  targetDropPercent: number;
  /** 指定配線長 [m]（オプション） */
  wiringDistanceMeters?: number;
}

/** 電線サイズ別の限界配線長テーブル 1行 */
export interface WireLimitRow {
  name: string;
  area: number;
  /** 目標降下率での限界長 [m] */
  maxDistanceMeters: number;
  /** 3.0%降下での限界長 [m] */
  maxDistance3PercentMeters: number;
  /** 熱的許容電流 [A]（周囲30℃・単独布設） */
  allowAmpA: number;
  /** 熱的に maxCurrentA を流せるか */
  heatOk: boolean;
  isRecommended: boolean;
}

// ==========================================
// 2. 定数・UIオプション・マスタデータ定義
// ==========================================

export const DEFAULT_AIRCON_INPUTS: Required<AirconInputParams> = {
  areaValue: 12,
  unit: "tatami",
  roomType: "living",
  buildingType: "wooden",
  personCount: 2,
  hasStrongSunlight: false,
  isTopFloor: false,
  hasHighCeiling: false,
  targetVoltageDropRatio: 2.0,
  wiringDistanceMeters: 0,
};

/**
 * エアコン専用回路の許容電流計算で使う条数。
 * CableBase は条数 1〜3 で電流減少係数 0.7 を掛けるため、単独布設(係数1.0)として
 * 扱うには 0 を渡す（calculateK2: wireCount <= 0 → 1.0）。
 */
export const AIRCON_WIRE_COUNT = 0;

export const UNIT_OPTIONS = [
  { label: "畳（帖）", value: "tatami" },
  { label: "㎡（平米）", value: "sqm" },
  { label: "坪", value: "tsubo" },
] as const;

export const ROOM_OPTIONS = [
  { label: "居間・リビング", value: "living", desc: "標準補正 ×1.10" },
  { label: "LDK・吹抜け", value: "ldk", desc: "開放空間 ×1.20" },
  { label: "台所・キッチン", value: "kitchen", desc: "火気・熱源あり ×1.30" },
  { label: "和室", value: "japanese", desc: "標準和室 ×1.05" },
  { label: "寝室", value: "bedroom", desc: "夜間主体 ×1.00" },
  { label: "子供部屋・書斎", value: "kids", desc: "標準洋室 ×1.00" },
] as const;

/**
 * 電圧降下計算用・電線サイズ優先順位マスタ
 * 断面積は cableBase.CABLE_SPECS から取得（ここでは名前と優先順位だけを持つ）。
 * 順序は意図的: 単線(mm)を先に、より線(sq)を後に試す。
 */
const AIRCON_WIRE_PRIORITY = [
  "1.6mm",
  "2.0mm",
  "2.6mm",
  "3.5 sq",
  "5.5 sq",
  "8.0 sq",
  "14.0 sq",
] as const;

export const WIRE_SIZE_CANDIDATES = AIRCON_WIRE_PRIORITY.map((name) => {
  const spec = CABLE_SPECS.find((s) => s.size === name);
  if (!spec) throw new Error(`CABLE_SPECS に ${name} がありません`);
  return { name, area: spec.area };
});

// エアコン能力マスタ
export const AC_SPECS: AcSpec[] = [
  {
    capacityKw: 2.2,
    tatamiStandard: "6畳用",
    minTatami: 6,
    maxTatami: 9,
    voltage: 100,
    phase: "1P2W",
    ratedCurrentA: 5.8,
    maxCurrentA: 15.0,
    breakerAmp: 15,
    breakerPoles: "2P1E",
    recommendedWireSize: "1.6mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 2.5,
    tatamiStandard: "8畳用",
    minTatami: 7,
    maxTatami: 10,
    voltage: 100,
    phase: "1P2W",
    ratedCurrentA: 6.8,
    maxCurrentA: 15.0,
    breakerAmp: 15,
    breakerPoles: "2P1E",
    recommendedWireSize: "1.6mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 2.8,
    tatamiStandard: "10畳用",
    minTatami: 8,
    maxTatami: 12,
    voltage: 100,
    phase: "1P2W",
    ratedCurrentA: 8.2,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: "2P1E",
    recommendedWireSize: "2.0mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 3.6,
    tatamiStandard: "12畳用",
    minTatami: 10,
    maxTatami: 15,
    voltage: 100,
    phase: "1P2W",
    ratedCurrentA: 10.5,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: "2P1E",
    recommendedWireSize: "2.0mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 4.0,
    tatamiStandard: "14畳用",
    minTatami: 11,
    maxTatami: 17,
    voltage: 200,
    phase: "1P3W",
    ratedCurrentA: 5.8,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: "2P2E",
    recommendedWireSize: "2.0mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 5.6,
    tatamiStandard: "18畳用",
    minTatami: 15,
    maxTatami: 23,
    voltage: 200,
    phase: "1P3W",
    ratedCurrentA: 8.5,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: "2P2E",
    recommendedWireSize: "2.0mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 6.3,
    tatamiStandard: "20畳用",
    minTatami: 17,
    maxTatami: 26,
    voltage: 200,
    phase: "1P3W",
    ratedCurrentA: 9.8,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: "2P2E",
    recommendedWireSize: "2.0mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 7.1,
    tatamiStandard: "23畳用",
    minTatami: 20,
    maxTatami: 30,
    voltage: 200,
    phase: "1P3W",
    ratedCurrentA: 11.5,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: "2P2E",
    recommendedWireSize: "2.0mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 8.0,
    tatamiStandard: "26畳用",
    minTatami: 22,
    maxTatami: 33,
    voltage: 200,
    phase: "1P3W",
    ratedCurrentA: 13.0,
    maxCurrentA: 30.0,
    breakerAmp: 30,
    breakerPoles: "2P2E",
    recommendedWireSize: "2.6mm",
    cableTypeCode: "vv",
  },
  {
    capacityKw: 9.0,
    tatamiStandard: "29畳用",
    minTatami: 25,
    maxTatami: 38,
    voltage: 200,
    phase: "1P3W",
    ratedCurrentA: 15.0,
    maxCurrentA: 30.0,
    breakerAmp: 30,
    breakerPoles: "2P2E",
    recommendedWireSize: "2.6mm",
    cableTypeCode: "vv",
  },
];