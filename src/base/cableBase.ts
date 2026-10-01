// src/base/cableBase.ts

// ==========================================
// 1. 電線・ケーブル 型定義
// ==========================================

export type InstallationType =
  | "conduit_3"
  | "conduit_4"
  | "ceiling_open"
  | "staple_surface";

export type CableTypeCode =
  | "vv"
  | "vvr"
  | "iv"
  | "em_eef"
  | "em_ief"
  | "hiv"
  | "cv"
  | "cvd"
  | "cvt"
  | "cvq"
  | "cv_2c"
  | "cv_3c"
  | "cv_4c"
  | "mlfc"
  | "ow"
  | "dv"
  | "vct"
  | "vctf"
  | "vff";

export interface SystemType {
  id: string;
  label: string;
  defaultVoltage: number;
  k: number;
  kFactor: number;
}

export interface VoltageDropParams {
  systemId: string;
  current: number;
  distance: number;
  wireSizeName: string;
  powerFactor?: number;
  useImpedance?: boolean;
}

export interface WireSelectionParams {
  systemId: string;
  voltage: number;
  targetDropPercent: number;
  current: number;
  distance: number;
  cableType: CableTypeCode;
  ambientTemp: number;
  wireCount: number;
  parallelCount?: number;
  powerFactor?: number;
  useImpedance?: boolean;
  /** 耐熱側で必要な電流 [A]（電動機の 1.25/1.1 倍則など）。省略時は current */
  requiredHeatAmp?: number;
}

export interface CableType {
  id: CableTypeCode;
  name: string;
  desc: string;
  maxTemp: number;
  tempCategory: "60" | "75" | "90" | "outdoor";
  limits: Record<string, number>;
  isIndoorWiringForbidden?: boolean;
  warningMessage?: string;
}

export interface WireSize {
  name: string;
  area: number;
  /** 選択中ケーブル種別での基準許容電流 [A]。getWireSizesForCable() が設定する */
  amp?: number;
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
  /** 電圧降下から決まる許容電流 [A]（距離未指定時は Infinity） */
  maxAmpereByDrop: number;
  /** 熱的許容電流 [A]（補正後。この種別で使えないサイズは 0） */
  allowAmpereByHeat: number;
  effectiveMaxAmp: number;
  isOkForLoad: boolean;
  /** ボトルネック要因 */
  limiter: "drop" | "heat" | "none";
  /** 指定電流・許容降下率における電圧降下上の最大こう長 [m]（0.1m 切り捨て） */
  maxDistanceMeters: number;
  /** 条件を満たす最小断面積のサイズか */
  isRecommended: boolean;
}

export interface ReductionFactorEntry {
  minWires: number;
  maxWires: number;
  factor: number;
}

// ==========================================
// 2. 電線・ケーブル 定数・マスタデータ
//    ★ CABLE_SPECS が唯一の定義。WIRE_SIZES / CABLE_TYPES.limits は派生。
//    サイズ・許容電流・r/x を変えるときは CABLE_SPECS だけを編集する。
// ==========================================

export const CABLE_SPECS: CableSpec[] = [
  {
    size: "0.75 sq",
    area: 0.75,
    r: 24.4,
    x: 0.11,
    baseAllowAmp: {
      vv: 7,
      vvr: 7,
      iv: 7,
      em_eef: 8,
      em_ief: 8,
      hiv: 8,
      cv: 0,
      cvd: 0,
      cvt: 0,
      cvq: 0,
      cv_2c: 0,
      cv_3c: 0,
      cv_4c: 0,
      mlfc: 0,
      ow: 9,
      dv: 9,
      vct: 7,
      vctf: 7,
      vff: 7,
    },
  },
  {
    size: "1.25 sq",
    area: 1.25,
    r: 14.7,
    x: 0.11,
    baseAllowAmp: {
      vv: 12,
      vvr: 12,
      iv: 12,
      em_eef: 13,
      em_ief: 13,
      hiv: 13,
      cv: 0,
      cvd: 0,
      cvt: 0,
      cvq: 0,
      cv_2c: 0,
      cv_3c: 0,
      cv_4c: 0,
      mlfc: 0,
      ow: 16,
      dv: 16,
      vct: 12,
      vctf: 12,
      vff: 12,
    },
  },
  {
    size: "1.6mm",
    area: 2.01,
    r: 8.92,
    x: 0.106,
    baseAllowAmp: {
      vv: 18,
      vvr: 18,
      iv: 27,
      em_eef: 21,
      em_ief: 31,
      hiv: 31,
      cv: 33,
      cvd: 27,
      cvt: 25,
      cvq: 24,
      cv_2c: 26,
      cv_3c: 24,
      cv_4c: 22,
      mlfc: 33,
      ow: 32,
      dv: 30,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "2.0mm",
    area: 3.14,
    r: 5.65,
    x: 0.101,
    baseAllowAmp: {
      vv: 24,
      vvr: 24,
      iv: 35,
      em_eef: 28,
      em_ief: 40,
      hiv: 40,
      cv: 44,
      cvd: 38,
      cvt: 35,
      cvq: 33,
      cv_2c: 36,
      cv_3c: 33,
      cv_4c: 30,
      mlfc: 44,
      ow: 42,
      dv: 39,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "2.6mm",
    area: 5.31,
    r: 3.33,
    x: 0.095,
    baseAllowAmp: {
      vv: 35,
      vvr: 35,
      iv: 48,
      em_eef: 40,
      em_ief: 55,
      hiv: 55,
      cv: 57,
      cvd: 49,
      cvt: 46,
      cvq: 43,
      cv_2c: 46,
      cv_3c: 40,
      cv_4c: 38,
      mlfc: 57,
      ow: 58,
      dv: 54,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "2.0 sq",
    area: 2.0,
    r: 9.24,
    x: 0.106,
    baseAllowAmp: {
      vv: 19,
      vvr: 19,
      iv: 27,
      em_eef: 22,
      em_ief: 31,
      hiv: 31,
      cv: 33,
      cvd: 27,
      cvt: 25,
      cvq: 24,
      cv_2c: 26,
      cv_3c: 24,
      cv_4c: 22,
      mlfc: 33,
      ow: 32,
      dv: 30,
      vct: 19,
      vctf: 17,
      vff: 17,
    },
  },
  {
    size: "3.5 sq",
    area: 3.5,
    r: 5.2,
    x: 0.101,
    baseAllowAmp: {
      vv: 27,
      vvr: 27,
      iv: 37,
      em_eef: 31,
      em_ief: 42,
      hiv: 42,
      cv: 44,
      cvd: 38,
      cvt: 35,
      cvq: 33,
      cv_2c: 36,
      cv_3c: 33,
      cv_4c: 30,
      mlfc: 44,
      ow: 44,
      dv: 41,
      vct: 27,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "5.5 sq",
    area: 5.5,
    r: 3.79,
    x: 0.101,
    baseAllowAmp: {
      vv: 37,
      vvr: 37,
      iv: 49,
      em_eef: 43,
      em_ief: 56,
      hiv: 56,
      cv: 57,
      cvd: 49,
      cvt: 46,
      cvq: 43,
      cv_2c: 46,
      cv_3c: 40,
      cv_4c: 38,
      mlfc: 57,
      ow: 58,
      dv: 54,
      vct: 37,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "8.0 sq",
    area: 8.0,
    r: 2.31,
    x: 0.097,
    baseAllowAmp: {
      vv: 49,
      vvr: 49,
      iv: 61,
      em_eef: 56,
      em_ief: 70,
      hiv: 70,
      cv: 78,
      cvd: 60,
      cvt: 51,
      cvq: 48,
      cv_2c: 57,
      cv_3c: 48,
      cv_4c: 45,
      mlfc: 78,
      ow: 75,
      dv: 70,
      vct: 49,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "14.0 sq",
    area: 14.0,
    r: 1.32,
    x: 0.093,
    baseAllowAmp: {
      vv: 69,
      vvr: 69,
      iv: 88,
      em_eef: 79,
      em_ief: 101,
      hiv: 101,
      cv: 110,
      cvd: 86,
      cvt: 73,
      cvq: 69,
      cv_2c: 81,
      cv_3c: 69,
      cv_4c: 65,
      mlfc: 110,
      ow: 107,
      dv: 99,
      vct: 69,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "22.0 sq",
    area: 22.0,
    r: 0.84,
    x: 0.089,
    baseAllowAmp: {
      vv: 80,
      vvr: 80,
      iv: 115,
      em_eef: 105,
      em_ief: 132,
      hiv: 132,
      cv: 145,
      cvd: 110,
      cvt: 96,
      cvq: 91,
      cv_2c: 105,
      cv_3c: 91,
      cv_4c: 86,
      mlfc: 145,
      ow: 140,
      dv: 130,
      vct: 88,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "38.0 sq",
    area: 38.0,
    r: 0.49,
    x: 0.086,
    baseAllowAmp: {
      vv: 115,
      vvr: 115,
      iv: 162,
      em_eef: 148,
      em_ief: 186,
      hiv: 186,
      cv: 205,
      cvd: 155,
      cvt: 132,
      cvq: 125,
      cv_2c: 148,
      cv_3c: 126,
      cv_4c: 119,
      mlfc: 205,
      ow: 190,
      dv: 180,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "60.0 sq",
    area: 60.0,
    r: 0.31,
    x: 0.083,
    baseAllowAmp: {
      vv: 150,
      vvr: 150,
      iv: 217,
      em_eef: 198,
      em_ief: 249,
      hiv: 249,
      cv: 275,
      cvd: 210,
      cvt: 181,
      cvq: 171,
      cv_2c: 198,
      cv_3c: 170,
      cv_4c: 161,
      mlfc: 275,
      ow: 250,
      dv: 235,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "100.0 sq",
    area: 100.0,
    r: 0.18,
    x: 0.08,
    baseAllowAmp: {
      vv: 205,
      vvr: 205,
      iv: 298,
      em_eef: 272,
      em_ief: 342,
      hiv: 342,
      cv: 385,
      cvd: 290,
      cvt: 253,
      cvq: 240,
      cv_2c: 280,
      cv_3c: 242,
      cv_4c: 229,
      mlfc: 385,
      ow: 345,
      dv: 325,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "150.0 sq",
    area: 150.0,
    r: 0.12,
    x: 0.078,
    baseAllowAmp: {
      vv: 260,
      vvr: 260,
      iv: 383,
      em_eef: 350,
      em_ief: 440,
      hiv: 440,
      cv: 495,
      cvd: 373,
      cvt: 324,
      cvq: 307,
      cv_2c: 356,
      cv_3c: 308,
      cv_4c: 291,
      mlfc: 495,
      ow: 440,
      dv: 415,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "200.0 sq",
    area: 200.0,
    r: 0.09,
    x: 0.077,
    baseAllowAmp: {
      vv: 310,
      vvr: 310,
      iv: 457,
      em_eef: 417,
      em_ief: 525,
      hiv: 525,
      cv: 605,
      cvd: 445,
      cvt: 385,
      cvq: 365,
      cv_2c: 423,
      cv_3c: 368,
      cv_4c: 349,
      mlfc: 605,
      ow: 525,
      dv: 495,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "250.0 sq",
    area: 250.0,
    r: 0.07,
    x: 0.076,
    baseAllowAmp: {
      vv: 355,
      vvr: 355,
      iv: 525,
      em_eef: 479,
      em_ief: 603,
      hiv: 603,
      cv: 700,
      cvd: 510,
      cvt: 445,
      cvq: 421,
      cv_2c: 489,
      cv_3c: 423,
      cv_4c: 402,
      mlfc: 700,
      ow: 600,
      dv: 565,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
  {
    size: "325.0 sq",
    area: 325.0,
    r: 0.05,
    x: 0.075,
    baseAllowAmp: {
      vv: 420,
      vvr: 420,
      iv: 622,
      em_eef: 568,
      em_ief: 714,
      hiv: 714,
      cv: 835,
      cvd: 610,
      cvt: 528,
      cvq: 501,
      cv_2c: 583,
      cv_3c: 501,
      cv_4c: 475,
      mlfc: 835,
      ow: 710,
      dv: 670,
      vct: 0,
      vctf: 0,
      vff: 0,
    },
  },
];

export const REDUCTION_FACTOR_TABLE: ReductionFactorEntry[] = [
  { minWires: 1, maxWires: 3, factor: 0.7 },
  { minWires: 4, maxWires: 4, factor: 0.63 },
  { minWires: 5, maxWires: 6, factor: 0.56 },
  { minWires: 7, maxWires: 15, factor: 0.49 },
  { minWires: 16, maxWires: 40, factor: 0.43 },
  { minWires: 41, maxWires: Infinity, factor: 0.39 },
];

const CABLE_TYPE_META: Omit<CableType, "limits">[] = [
  {
    id: "vv",
    name: "VVF (平形ビニル)",
    desc: "標準室内配線 (許容温度 60℃)",
    maxTemp: 60,
    tempCategory: "60",
  },
  {
    id: "vvr",
    name: "VVR (丸形ビニル)",
    desc: "幹配線・動力用丸形 (許容温度 60℃)",
    maxTemp: 60,
    tempCategory: "60",
  },
  {
    id: "iv",
    name: "IV (ビニル絶縁電線)",
    desc: "配管内配線用 (許容温度 60℃)",
    maxTemp: 60,
    tempCategory: "60",
  },
  {
    id: "em_eef",
    name: "EM-EEF (エコ電線平形)",
    desc: "耐燃性ポリエチレン (許容温度 75℃)",
    maxTemp: 75,
    tempCategory: "75",
  },
  {
    id: "em_ief",
    name: "EM-IEF (エコ絶縁電線)",
    desc: "耐燃性ポリエチレン絶縁 (許容温度 75℃)",
    maxTemp: 75,
    tempCategory: "75",
  },
  {
    id: "hiv",
    name: "HIV (二種耐熱形ビニル)",
    desc: "盤内・高耐熱配線 (許容温度 75℃)",
    maxTemp: 75,
    tempCategory: "75",
  },
  {
    id: "cv",
    name: "CV 1C (単心3条)",
    desc: "高容量幹配線 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "cvd",
    name: "CVD (2心より合わせ)",
    desc: "単相2線式幹配線 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "cvt",
    name: "CVT (3心より合わせ)",
    desc: "三相/単三幹配線 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "cvq",
    name: "CVQ (4心より合わせ)",
    desc: "4線式配線 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "cv_2c",
    name: "CV-2C (シース2心)",
    desc: "一括シース丸形2心 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "cv_3c",
    name: "CV-3C (シース3心)",
    desc: "一括シース丸形3心 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "cv_4c",
    name: "CV-4C (シース4心)",
    desc: "一括シース丸形4心 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "mlfc",
    name: "MLFC (難燃ポリフレックス)",
    desc: "盤内・端末配線用 (許容温度 90℃)",
    maxTemp: 90,
    tempCategory: "90",
  },
  {
    id: "ow",
    name: "OW (屋外用架空ビニル)",
    desc: "屋外空調架空線 (高放熱)",
    maxTemp: 60,
    tempCategory: "outdoor",
  },
  {
    id: "dv",
    name: "DV (引込用ビニル)",
    desc: "建物引込部空中配線 (高放熱)",
    maxTemp: 60,
    tempCategory: "outdoor",
  },
  {
    id: "vct",
    name: "VCT (ビニルキャブタイヤケーブル)",
    desc: "移動用機器・延長ケーブル用 (※屋内固定配線不可)",
    maxTemp: 60,
    tempCategory: "60",
    isIndoorWiringForbidden: true,
    warningMessage:
      "VCTは機器への電源供給・延長用です。壁内や天井などの屋内固定配線には使用できません（電気設備技術基準）。",
  },
  {
    id: "vctf",
    name: "VCTF / VCT-F (ビニルキャブタイヤコード)",
    desc: "小型機器・延長コード用 (※屋内固定配線不可)",
    maxTemp: 60,
    tempCategory: "60",
    isIndoorWiringForbidden: true,
    warningMessage:
      "VCTFは小型機器電源供給・延長コード専用です。壁内等の固定配線には使用できません（内線規程）。",
  },
  {
    id: "vff",
    name: "VFF (小判コード / 平形コード)",
    desc: "器具コード・家庭用延長コード (※屋内固定配線不可)",
    maxTemp: 60,
    tempCategory: "60",
    isIndoorWiringForbidden: true,
    warningMessage:
      "小判コード(VFF)は器具電源・延長用です。壁内や造営物への固定配線には使用できません。",
  },
];

export const CABLE_TEMP_GROUPS = [
  { label: "60℃ (低熱・標準室内配線)", items: ["vv", "vvr", "iv"] },
  { label: "75℃ (中熱・エコ・耐熱)", items: ["em_eef", "em_ief", "hiv"] },
  {
    label: "90℃ (高耐熱・大容量幹配線)",
    items: ["cv", "cvd", "cvt", "cvq", "cv_2c", "cv_3c", "cv_4c", "mlfc"],
  },
  { label: "屋外空中架空 (放熱良好)", items: ["ow", "dv"] },
  {
    label: "機器電源・延長コード (※屋内固定配線不可)",
    items: ["vct", "vctf", "vff"],
  },
];

export const SYSTEM_DEFINITIONS: SystemType[] = [
  {
    id: "1P2W",
    label: "単相2線式 / 直流2線",
    defaultVoltage: 100,
    k: 35.6,
    kFactor: 2.0,
  },
  {
    id: "1P3W_100V",
    label: "単相3線式 (100V負荷)",
    defaultVoltage: 100,
    k: 17.8,
    kFactor: 1.0,
  },
  {
    id: "1P3W_200V",
    label: "単相3線式 (200V負荷)",
    defaultVoltage: 200,
    k: 35.6,
    kFactor: 2.0,
  },
  {
    id: "3P3W",
    label: "三相3線式 (線間)",
    defaultVoltage: 200,
    k: 30.8,
    kFactor: 1.732,
  },
];

// ==========================================
// 派生データ（CABLE_SPECS から生成。直接編集しない）
// ==========================================

/** 全サイズ一覧（CABLE_SPECS の並び順） */
export const WIRE_SIZES: WireSize[] = CABLE_SPECS.map((spec) => ({
  name: spec.size,
  area: spec.area,
}));

const buildLimits = (id: CableTypeCode): Record<string, number> =>
  Object.fromEntries(
    CABLE_SPECS.filter((spec) => spec.baseAllowAmp[id] > 0).map((spec) => [
      spec.size,
      spec.baseAllowAmp[id],
    ]),
  );

/** ケーブル種別一覧。limits は CABLE_SPECS.baseAllowAmp からの派生 */
export const CABLE_TYPES: CableType[] = CABLE_TYPE_META.map((meta) => ({
  ...meta,
  limits: buildLimits(meta.id),
}));

/**
 * 指定ケーブル種別で使える電線サイズ一覧（amp = 基準許容電流）。
 * UI の電線サイズ選択はこれを使う。
 */
export function getWireSizesForCable(cableTypeId: CableTypeCode): WireSize[] {
  return CABLE_SPECS.filter((spec) => spec.baseAllowAmp[cableTypeId] > 0).map(
    (spec) => ({
      name: spec.size,
      area: spec.area,
      amp: spec.baseAllowAmp[cableTypeId],
    }),
  );
}

// ==========================================
// 3. 許容電流・動的補正計算エンジン関数群
// ==========================================

export const REDUCTION_FACTORS: Record<InstallationType, number> = {
  conduit_3: 0.7,
  conduit_4: 0.63,
  ceiling_open: 1.0,
  staple_surface: 0.85,
};

// ==========================================
// 3. 許容電流・動的補正計算エンジン関数群
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

export function calculateK2(
  wireCount: number,
  isRackSpaced: boolean = false,
): number {
  if (isRackSpaced || wireCount <= 0) {
    return 1.0;
  }
  const entry = REDUCTION_FACTOR_TABLE.find(
    (item) => wireCount >= item.minWires && wireCount <= item.maxWires,
  );
  return entry ? entry.factor : 0.7;
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
    isRackSpaced = false,
  } = params;

  const k1 = calculateK1(maxTemp, ambientTemp);
  const k2 = calculateK2(wireCount, isRackSpaced);

  const singleAllowAmp = Math.floor(baseAllowAmp * k1 * k2);
  const totalAllowAmp = singleAllowAmp * Math.max(1, parallelCount);

  return {
    k1: Math.round(k1 * 100) / 100,
    k2,
    singleAllowAmp,
    totalAllowAmp,
  };
}

// ==========================================
// 4. 名前解決ヘルパー
// ==========================================

/** "2.0 sq" / "2.0sq" / "2.0 sq (19A)" を同一視して比較用に正規化 */
function normalizeWireSizeName(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function findCableSpec(wireSizeName: string): CableSpec | undefined {
  const exact = CABLE_SPECS.find((spec) => spec.size === wireSizeName);
  if (exact) return exact;
  const normalized = normalizeWireSizeName(wireSizeName);
  return CABLE_SPECS.find(
    (spec) => normalizeWireSizeName(spec.size) === normalized,
  );
}

function findWireSize(wireSizeName: string): WireSize | undefined {
  const spec = findCableSpec(wireSizeName);
  return spec ? { name: spec.size, area: spec.area } : undefined;
}

function getEffectiveImpedance(
  spec: CableSpec,
  powerFactor: number,
  useImpedance: boolean,
): number {
  const pf = Math.min(1, Math.max(0, powerFactor));
  if (useImpedance) {
    return Math.sqrt(spec.r * spec.r + spec.x * spec.x);
  }
  const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));
  return spec.r * pf + spec.x * sinPhi;
}

const round1 = (v: number): number =>
  Number.isFinite(v) ? Math.round(v * 10) / 10 : v;

// ==========================================
// 5. CableBase（配線計算の唯一の窓口）
// ==========================================

export class CableBase {
  static getSystem(systemId: string): SystemType | undefined {
    return SYSTEM_DEFINITIONS.find((system) => system.id === systemId);
  }

  static getCableType(cableTypeId: CableTypeCode): CableType | undefined {
    return CABLE_TYPES.find((cable) => cable.id === cableTypeId);
  }

  static getWireSize(wireSizeName: string): WireSize | undefined {
    return findWireSize(wireSizeName);
  }

  static getCableSpec(wireSizeName: string): CableSpec | undefined {
    return findCableSpec(wireSizeName);
  }

  static isValidWireSize(wireSizeName: string): boolean {
    return findCableSpec(wireSizeName) !== undefined;
  }

  static isIndoorWiringForbidden(cableTypeId: CableTypeCode): boolean {
    return this.getCableType(cableTypeId)?.isIndoorWiringForbidden === true;
  }

  static getAllowableCurrent(
    cableTypeId: CableTypeCode,
    wireSizeName: string,
    ambientTemp: number,
    wireCount: number,
    parallelCount = 1,
  ): ReturnType<typeof calculateAllowableCurrent> {
    const cable = this.getCableType(cableTypeId);
    const spec = findCableSpec(wireSizeName);
    const baseAllowAmp = spec?.baseAllowAmp[cableTypeId] ?? 0;
    if (!cable || baseAllowAmp <= 0) {
      return { k1: 0, k2: 0, singleAllowAmp: 0, totalAllowAmp: 0 };
    }

    return calculateAllowableCurrent({
      baseAllowAmp,
      maxTemp: cable.maxTemp,
      ambientTemp,
      wireCount,
      parallelCount,
    });
  }

  static calculateVoltageDrop(params: VoltageDropParams): number {
    const system = this.getSystem(params.systemId);
    const spec = this.getCableSpec(params.wireSizeName);
    if (!system || !spec || params.current <= 0 || params.distance <= 0) {
      return 0;
    }

    const powerFactor = params.powerFactor ?? 1;
    const useImpedance = params.useImpedance ?? false;
    const equivalent = getEffectiveImpedance(spec, powerFactor, useImpedance);

    return (
      (params.current * params.distance * equivalent * system.kFactor) / 1000
    );
  }

  static calculateMaxDistance(
    voltage: number,
    targetDropPercent: number,
    current: number,
    wireSizeName: string,
    systemId: string,
    powerFactor = 1,
    useImpedance = false,
  ): number {
    const system = this.getSystem(systemId);
    const spec = this.getCableSpec(wireSizeName);
    if (
      !system ||
      !spec ||
      voltage <= 0 ||
      targetDropPercent <= 0 ||
      current <= 0
    ) {
      return 0;
    }

    const allowableDropV = voltage * (targetDropPercent / 100);
    const equivalent = getEffectiveImpedance(spec, powerFactor, useImpedance);
    if (equivalent <= 0) return 0;

    return (allowableDropV * 1000) / (current * equivalent * system.kFactor);
  }

  static getAdjacentWireSize(
    wireSizeName: string,
    step: "next" | "prev",
  ): string {
    const index = CABLE_SPECS.findIndex(
      (spec) => spec === findCableSpec(wireSizeName),
    );
    if (index < 0) return wireSizeName;

    const delta = step === "next" ? 1 : -1;
    const nextIndex = Math.min(
      Math.max(0, index + delta),
      CABLE_SPECS.length - 1,
    );
    return CABLE_SPECS[nextIndex].size;
  }

  /**
   * 全サイズを評価する（useReversedCallc はこれを呼ぶだけ）。
   * - 距離 <= 0 : 電圧降下の制約なし（maxAmpereByDrop = Infinity）
   * - 電圧 <= 0 または許容降下率 <= 0 : どのサイズも不可（maxAmpereByDrop = 0）
   * - 不明な systemId : 全サイズ不可（呼び出し側でフォールバックすること）
   */
  static evaluateAllWireSizes(
    params: WireSelectionParams,
  ): AvailableWireResult[] {
    const system = this.getSystem(params.systemId);
    const cable = this.getCableType(params.cableType);
    const requiredHeatAmp = params.requiredHeatAmp ?? params.current;
    const allowableDropV =
      params.voltage > 0 && params.targetDropPercent > 0
        ? params.voltage * (params.targetDropPercent / 100)
        : 0;

    const rows = CABLE_SPECS.map((spec) => {
      const heat = cable
        ? this.getAllowableCurrent(
            params.cableType,
            spec.size,
            params.ambientTemp,
            params.wireCount,
            params.parallelCount ?? 1,
          )
        : { totalAllowAmp: 0 };
      const allowAmpereByHeat = heat.totalAllowAmp;

      const z = getEffectiveImpedance(
        spec,
        params.powerFactor ?? 1,
        params.useImpedance ?? false,
      );
      const kFactor = system?.kFactor ?? 0;

      let maxAmpereByDrop: number;
      let maxDistanceMeters: number;
      if (!system || allowableDropV <= 0 || z <= 0) {
        maxAmpereByDrop = system && allowableDropV > 0 ? Infinity : 0; // z<=0 は降下なし
        maxDistanceMeters = 0;
      } else {
        maxAmpereByDrop =
          params.distance > 0
            ? (allowableDropV * 1000) / (params.distance * z * kFactor)
            : Infinity;
        maxDistanceMeters =
          params.current > 0
            ? Math.floor(
                ((allowableDropV * 1000) / (params.current * z * kFactor)) * 10,
              ) / 10
            : 0;
      }

      const effectiveMaxAmp = Math.min(maxAmpereByDrop, allowAmpereByHeat);
      const isOkForLoad =
        allowAmpereByHeat > 0 &&
        Number.isFinite(effectiveMaxAmp) &&
        params.current <= effectiveMaxAmp &&
        allowAmpereByHeat >= requiredHeatAmp;

      let limiter: AvailableWireResult["limiter"] = "none";
      if (maxAmpereByDrop < allowAmpereByHeat) limiter = "drop";
      else if (allowAmpereByHeat < maxAmpereByDrop) limiter = "heat";

      return {
        wireName: spec.size,
        area: spec.area,
        maxAmpereByDrop: round1(maxAmpereByDrop),
        allowAmpereByHeat: round1(allowAmpereByHeat),
        effectiveMaxAmp: round1(effectiveMaxAmp),
        isOkForLoad,
        limiter,
        maxDistanceMeters,
        isRecommended: false,
      } satisfies AvailableWireResult;
    });

    const okAreas = rows.filter((r) => r.isOkForLoad).map((r) => r.area);
    const minArea = okAreas.length > 0 ? Math.min(...okAreas) : Infinity;
    return rows.map((r) => ({
      ...r,
      isRecommended: r.isOkForLoad && r.area === minArea,
    }));
  }

  /** 条件を満たす最小断面積のサイズ（なければ null） */
  static selectSuitableWireSize(
    params: WireSelectionParams,
  ): AvailableWireResult | null {
    return (
      this.evaluateAllWireSizes(params).find((r) => r.isRecommended) ?? null
    );
  }
}

export default CableBase;