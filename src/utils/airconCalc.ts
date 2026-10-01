import {
  type AcSpec,
  type AreaUnit,
  type RoomType,
  type AirconInputParams,
  type AirconMaxDistanceResult,
  type AirconVoltageDropCheckResult,
  type AirconRequiredWireSelectionResult,
  type AirconSelectionResult,
  AC_SPECS,
  WIRE_SIZE_CANDIDATES,
} from "@/base/airconBase";
import { CableBase } from "@/base/cableBase";

// ==========================================
// 1. ユーティリティ・補助計算関数
// ==========================================

export function getAirconSystemId(spec: AcSpec): string {
  if (spec.voltage === 200 && spec.phase === "1P3W") {
    return "1P3W_200V";
  }
  if (spec.voltage === 100 && spec.phase === "1P3W") {
    return "1P3W_100V";
  }
  return "1P2W";
}

/** "VVF 1.6mm" → "1.6mm"（英字の種別プレフィックスと空白だけを除去） */
export function extractWireSizeName(wireSizeStr: string): string {
  if (!wireSizeStr) return "1.6mm";
  return wireSizeStr.replace(/^[A-Za-z][A-Za-z0-9-]*\s+/, "");
}

/** 断面積 [mm²]。cableBase.CABLE_SPECS を唯一の定義として参照する */
export function getWireArea(wireSizeStr: string): number {
  return (
    CableBase.getCableSpec(extractWireSizeName(wireSizeStr))?.area ??
    CableBase.getCableSpec(wireSizeStr)?.area ??
    2.01
  );
}

export function convertToTatami(
  value: number,
  unit: AreaUnit = "tatami"
): number {
  if (value <= 0) return 0;
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
// 2. 電圧降下・配線長・ケーブル選定ロジック
// ==========================================

/**
 * 許容電圧降下率に基づく限界配線長 [m] を算出
 * 簡略計算式: L = (e * A * 1000) / (k * I)
 *  - 単相2線100V / 単相3線200V線間 ともに配線定数 k = 35.6
 */
export function calculateAirconMaxDistance(
  spec: AcSpec,
  targetDropRatio: number = 2.0,
  wireSizeOverride?: string
): AirconMaxDistanceResult {
  const wireSizeStr = wireSizeOverride || spec.recommendedWireSize;
  const area = getWireArea(wireSizeStr);
  const currentA = spec.maxCurrentA;
  const voltage = spec.voltage;
  const k = 35.6; // 1P2W, 1P3W (線間) 定数

  // 許容電圧降下 [V]
  const allowableDropVolts = (voltage * targetDropRatio) / 100;
  const allowableDropVolts3 = (voltage * 3.0) / 100;

  // L [m] = (e [V] * A [mm2] * 1000) / (k * I [A])
  const rawDistance = (allowableDropVolts * area * 1000) / (k * currentA);
  const rawDistance3 = (allowableDropVolts3 * area * 1000) / (k * currentA);

  const maxDistanceMeters = Math.floor(rawDistance * 10) / 10;
  const maxDistance3PercentMeters = Math.floor(rawDistance3 * 10) / 10;

  return {
    wireSize: wireSizeStr,
    crossSectionArea: area,
    currentA,
    dropRatioPercent: targetDropRatio,
    allowableDropVolts,
    maxDistanceMeters,
    maxDistance3PercentMeters,
    note: `電線サイズ ${wireSizeStr} (${area}mm²) / 電圧降下${targetDropRatio.toFixed(1)}% (${allowableDropVolts}V) 制限時: 最大 ${maxDistanceMeters}m (3.0%降下時: ${maxDistance3PercentMeters}m)`,
  };
}

/**
 * 指定配線長 [m] における電圧降下量 [V]・降下率 [%] を算定および評価
 */
export function calculateAirconVoltageDrop(
  spec: AcSpec,
  distanceMeters: number,
  wireSizeOverride?: string
): AirconVoltageDropCheckResult {
  const wireSizeStr = wireSizeOverride || spec.recommendedWireSize;
  const area = getWireArea(wireSizeStr);
  const currentA = spec.maxCurrentA;
  const voltage = spec.voltage;
  const k = 35.6;

  if (distanceMeters <= 0) {
    return {
      distanceMeters: 0,
      wireSize: wireSizeStr,
      dropVolts: 0,
      dropRatioPercent: 0,
      isOk2Percent: true,
      isOk3Percent: true,
      statusNote: "配線長が指定されていません。",
    };
  }

  // 電圧降下 e = (k * I * L) / (1000 * A)
  const dropVolts = (k * currentA * distanceMeters) / (1000 * area);
  const dropRatioPercent = (dropVolts / voltage) * 100;

  const roundedVolts = Math.round(dropVolts * 100) / 100;
  const roundedRatio = Math.round(dropRatioPercent * 100) / 100;

  const isOk2Percent = roundedRatio <= 2.0;
  const isOk3Percent = roundedRatio <= 3.0;

  let statusNote = "";
  if (isOk2Percent) {
    statusNote = `配線長${distanceMeters}m: 電圧降下${roundedVolts}V (${roundedRatio}%) - 基準(2.0%)クリア`;
  } else if (isOk3Percent) {
    statusNote = `配線長${distanceMeters}m: 電圧降下${roundedVolts}V (${roundedRatio}%) - 2.0%超過ですが内線規程限界(3.0%)以内です`;
  } else {
    statusNote = `配線長${distanceMeters}m: 電圧降下${roundedVolts}V (${roundedRatio}%) - 3.0%超過のため太い配線サイズへの変更が推奨されます`;
  }

  return {
    distanceMeters,
    wireSize: wireSizeStr,
    dropVolts: roundedVolts,
    dropRatioPercent: roundedRatio,
    isOk2Percent,
    isOk3Percent,
    statusNote,
  };
}

/**
 * 指定配線長 [m] に対し、許容電圧降下率を満たす最適なケーブル（電線サイズ）を自動選定
 */
export function selectCableSizeForDistance(
  spec: AcSpec,
  distanceMeters: number,
  targetDropRatio: number = 2.0
): AirconRequiredWireSelectionResult {
  const currentA = spec.maxCurrentA;
  const voltage = spec.voltage;
  const k = 35.6;
  const allowableDropVolts = (voltage * targetDropRatio) / 100;

  // 必要最小断面積 A_req = (k * I * L) / (1000 * e_allow)
  const requiredArea =
    distanceMeters > 0
      ? (k * currentA * distanceMeters) / (1000 * allowableDropVolts)
      : 0;

  const roundedReqArea = Math.round(requiredArea * 100) / 100;

  // マスタから条件を満たす最小の電線を選定
  let selectedCandidate = WIRE_SIZE_CANDIDATES.find(
    (c) => c.area >= requiredArea
  );

  if (!selectedCandidate) {
    selectedCandidate =
      WIRE_SIZE_CANDIDATES[WIRE_SIZE_CANDIDATES.length - 1];
  }

  const actualDropVolts =
    distanceMeters > 0
      ? (k * currentA * distanceMeters) / (1000 * selectedCandidate.area)
      : 0;
  const actualDropRatio = (actualDropVolts / voltage) * 100;

  const roundedActualVolts = Math.round(actualDropVolts * 100) / 100;
  const roundedActualRatio = Math.round(actualDropRatio * 100) / 100;

  let selectionNote = "";
  if (distanceMeters <= 0) {
    selectionNote = "配線長を入力すると適切な電線サイズを推奨します。";
  } else if (selectedCandidate.area >= requiredArea) {
    selectionNote = `配線長 ${distanceMeters}m (許容降下率${targetDropRatio.toFixed(1)}%): 推奨線径は【${selectedCandidate.name}】(${selectedCandidate.area}mm²) です (実電圧降下: ${roundedActualVolts}V / ${roundedActualRatio}%)。`;
  } else {
    selectionNote = `配線長 ${distanceMeters}m: 標準適合範囲を超えるため、要個別設計検討（必要断面積: ${roundedReqArea}mm²）。`;
  }

  return {
    distanceMeters,
    targetDropRatio,
    requiredArea: roundedReqArea,
    selectedWireSize: selectedCandidate.name,
    selectedArea: selectedCandidate.area,
    actualDropVolts: roundedActualVolts,
    actualDropRatio: roundedActualRatio,
    selectionNote,
  };
}

// ==========================================
// 3. エアコン適合選定コア計算ロジック
// ==========================================

export function calculateAirconSelection(
  params: AirconInputParams
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
    targetVoltageDropRatio = 2.0,
    wiringDistanceMeters = 0,
  } = params;

  const baseTatami = convertToTatami(areaValue, unit);
  const breakdownNotes: string[] = [];

  // 1. 部屋用途補正
  const roomMult = getRoomMultiplier(roomType);
  if (roomMult !== 1.0) {
    breakdownNotes.push(`部屋用途補正 (${roomType}): ×${roomMult.toFixed(2)}`);
  }

  // 2. 日当たり・構造・天井高補正
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

  // 3. 在室人数による人熱負荷加算
  const BASE_PERSONS = 2;
  const extraPersons = Math.max(0, personCount - BASE_PERSONS);
  const personHeatLoadKw = Math.round(extraPersons * 0.1 * 100) / 100;
  const personHeatTatami = Math.round(extraPersons * 0.5 * 10) / 10;

  if (extraPersons > 0) {
    calculatedTatami += personHeatTatami;
    breakdownNotes.push(
      `人熱負荷 (${personCount}人 / 標準${BASE_PERSONS}人比+${extraPersons}人): +${personHeatTatami}畳分 (+${personHeatLoadKw}kW)`
    );
  }

  const effectiveTatami = Math.round(calculatedTatami * 10) / 10;

  // 4. マスタ適合判定
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

  // 5. 電圧降下限界配線長算出
  const maxDistanceInfo = calculateAirconMaxDistance(
    selectedSpec,
    targetVoltageDropRatio
  );

  // 6. 配線長指定時の検証＆ケーブル自動選定（オプション）
  let voltageDropCheckInfo: AirconVoltageDropCheckResult | undefined;
  let requiredWireSelectionInfo: AirconRequiredWireSelectionResult | undefined;

  if (wiringDistanceMeters > 0) {
    voltageDropCheckInfo = calculateAirconVoltageDrop(
      selectedSpec,
      wiringDistanceMeters
    );
    requiredWireSelectionInfo = selectCableSizeForDistance(
      selectedSpec,
      wiringDistanceMeters,
      targetVoltageDropRatio
    );
  }

  // 7. アドバイスコメント生成
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

  recommendationNote += ` [電圧降下${targetVoltageDropRatio}%時 最大配線長: 約${maxDistanceInfo.maxDistanceMeters}m]`;

  if (wiringDistanceMeters > 0 && requiredWireSelectionInfo) {
    recommendationNote += ` ※指定配線長${wiringDistanceMeters}mにおける推奨線径: ${requiredWireSelectionInfo.selectedWireSize}`;
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
    maxDistanceInfo,
    voltageDropCheckInfo,
    requiredWireSelectionInfo,
    recommendationNote,
    breakdownNotes,
  };
}