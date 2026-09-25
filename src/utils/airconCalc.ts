import type { CableTypeCode } from "@/types/appDefinitions";

// ==========================================
// 1. 型定義
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

  /** 定格電圧 */
  voltage: 100 | 200;

  /** 電源方式 */
  phase: "1P2W" | "1P3W";

  /** 定格運転電流 */
  ratedCurrentA: number;

  /** 最大運転電流 */
  maxCurrentA: number;

  /** 推奨専用回路ブレーカー容量 */
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
}

export interface AirconSelectionResult {
  /** 補正後実効畳数 */
  effectiveTatami: number;

  /** 換算後基本畳数 */
  baseTatami: number;

  /** 人熱による加算熱負荷 */
  personHeatLoadKw: number;

  /** 人熱による換算畳数加算 */
  personHeatTatami: number;

  /** 選定されたエアコン */
  selectedSpec: AcSpec;

  /** 最大スペック超過 */
  isOverCapacity: boolean;

  /** 推奨コメント */
  recommendationNote: string;

  /** 計算根拠 */
  breakdownNotes: string[];
}

// ==========================================
// 2. エアコン能力マスタ
// ==========================================

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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
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
    cableTypeCode: "vvf",
  },
];

// ==========================================
// 3. ユーティリティ
// ==========================================

export function extractWireSizeName(wireSizeStr: string): string {
  if (!wireSizeStr) {
    return "1.6mm";
  }

  return wireSizeStr.replace(/^[A-Za-z0-9\-]+\s*/, "");
}

export function convertToTatami(
  value: number,
  unit: AreaUnit = "tatami",
): number {
  if (value <= 0) {
    return 0;
  }

  switch (unit) {
    case "sqm":
      return value / 1.65;

    case "tsubo":
      return value * 2.0;

    case "tatami":
    default:
      return value;
  }
}

export function getRoomMultiplier(roomType: RoomType = "living"): number {
  switch (roomType) {
    case "kitchen":
      return 1.3;

    case "ldk":
      return 1.2;

    case "living":
      return 1.1;

    case "japanese":
      return 1.05;

    case "bedroom":
    case "kids":
    default:
      return 1.0;
  }
}

// ==========================================
// 4. エアコン選定
// ==========================================

export function calculateAirconSelection(
  params: AirconInputParams,
): AirconSelectionResult {
  const {
    areaValue,
    unit = "tatami",
    roomType = "living",
    buildingType = "wooden",
    personCount = 2,
    hasStrongSunlight = false,
    isTopFloor = false,
    hasHighCeiling = false,
  } = params;

  const baseTatami = convertToTatami(areaValue, unit);

  const breakdownNotes: string[] = [];

  // ------------------------------------------
  // 1. 部屋用途補正
  // ------------------------------------------

  const roomMult = getRoomMultiplier(roomType);

  if (roomMult !== 1.0) {
    breakdownNotes.push(`部屋用途補正 (${roomType}): ×${roomMult.toFixed(2)}`);
  }

  // ------------------------------------------
  // 2. 環境補正
  // ------------------------------------------

  let envMult = 1.0;

  if (hasStrongSunlight) {
    envMult += 0.1;

    breakdownNotes.push("日当たり強 / 大開口窓補正: +10%");
  }

  if (isTopFloor) {
    envMult += 0.1;

    breakdownNotes.push("最上階 / 屋根直下補正: +10%");
  }

  if (hasHighCeiling) {
    envMult += 0.15;

    breakdownNotes.push("吹き抜け / 高天井補正: +15%");
  }

  let calculatedTatami = baseTatami * roomMult * envMult;

  // ------------------------------------------
  // 3. 人熱負荷
  // ------------------------------------------

  const BASE_PERSONS = 2;

  const extraPersons = Math.max(0, personCount - BASE_PERSONS);

  const personHeatLoadKw = Math.round(extraPersons * 0.1 * 100) / 100;

  const personHeatTatami = Math.round(extraPersons * 0.5 * 10) / 10;

  if (extraPersons > 0) {
    calculatedTatami += personHeatTatami;

    breakdownNotes.push(
      `人熱負荷 (${personCount}人 / 標準${BASE_PERSONS}人比+${extraPersons}人): +${personHeatTatami}畳分 (+${personHeatLoadKw}kW)`,
    );
  }

  const effectiveTatami = Math.round(calculatedTatami * 10) / 10;

  // ------------------------------------------
  // 4. エアコン選定
  // ------------------------------------------

  let selectedSpec = AC_SPECS[0];

  let isOverCapacity = false;

  for (let i = 0; i < AC_SPECS.length; i++) {
    const spec = AC_SPECS[i];

    const thresholdTatami =
      buildingType === "reinforced" ? spec.maxTatami : spec.minTatami;

    if (effectiveTatami <= thresholdTatami) {
      selectedSpec = spec;
      break;
    }

    if (i === AC_SPECS.length - 1 && effectiveTatami > thresholdTatami) {
      selectedSpec = spec;
      isOverCapacity = true;
    }
  }

  // ------------------------------------------
  // 5. 推奨コメント
  // ------------------------------------------

  let recommendationNote = `実効負荷 ${effectiveTatami} 畳（${
    buildingType === "wooden" ? "木造" : "鉄筋マンション"
  }基準）に対し【${selectedSpec.tatamiStandard}（冷房能力 ${
    selectedSpec.capacityKw
  }kW）】が最適です。`;

  if (selectedSpec.voltage === 200) {
    recommendationNote += ` 電源は単相200V専用回路（2P2Eブレーカー、推奨線径 VVF ${selectedSpec.recommendedWireSize}）が必要です。`;
  } else {
    recommendationNote += ` 電源は単相100V専用回路（推奨線径 VVF ${selectedSpec.recommendedWireSize}）が必要です。`;
  }

  if (isOverCapacity) {
    recommendationNote += ` ※負荷が家庭用最大クラス（29畳用）を超えているため、複数台設置またはパッケージエアコンの導入をご検討ください。`;
  }

  return {
    effectiveTatami,

    baseTatami: Math.round(baseTatami * 10) / 10,

    personHeatLoadKw,

    personHeatTatami,

    selectedSpec,

    isOverCapacity,

    recommendationNote,

    breakdownNotes,
  };
}
