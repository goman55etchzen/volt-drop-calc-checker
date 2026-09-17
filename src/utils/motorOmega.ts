import { EnvironmentType, GroundingResult, CapacitorSelectionResult } from '@/types/appDefinitions';

export interface ElcbSelectionResult {
  recommendedAmp: number;
  sensitivityCurrent: number;
  operatingTime: string;
  isMandatory: boolean;
  description: string;
}

/** 1. 接地・絶縁抵抗計算 */
export function calculateMotorGrounding(
  voltage: number,
  environment: EnvironmentType
): GroundingResult {
  const isOver300V = voltage > 300;
  const notes: string[] = [];

  const groundType = isOver300V ? 'C種接地工事' : 'D種接地工事';
  const groundResistance = isOver300V ? 10 : 100;
  const insulationResistance = isOver300V ? 0.4 : 0.2;
  const groundWireDiameter = isOver300V
    ? '1.6mm以上 (公称断面積 2.0sq以上)'
    : '1.6mm以上';

  let requiresELCB = false;

  if (environment === 'wet') {
    requiresELCB = true;
    notes.push(
      '水気のある場所への設置です。感電防止用漏電遮断器（定格感度電流15mA以下・動作時間0.1秒以内）の設置が必須です。'
    );
  } else if (environment === 'enclosure') {
    notes.push(
      '金属製外箱・鉄骨構造環境です。接触感電防止のため漏電遮断器の設置を推奨します。'
    );
  }

  if (requiresELCB || environment === 'enclosure') {
    notes.push(
      '0.5秒以内に自動遮断する漏電遮断器を設ける場合、接地抵抗値は 500Ω 以下まで緩和可能です。'
    );
  }

  return {
    groundType,
    groundResistance,
    allowableResistanceWithElcb: 500,
    insulationResistance,
    groundWireDiameter,
    requiresELCB,
    notes,
  };
}

/** 2. 漏電遮断器 (ELCB) 選定関数 */
export function selectMotorELCB(
  calculatedAmp: number,
  environment: EnvironmentType,
  breakerSizes: number[]
): ElcbSelectionResult {
  const target = calculatedAmp * 3.0;
  const recommendedAmp =
    breakerSizes.find((s) => s >= target) || breakerSizes[breakerSizes.length - 1];

  const sensitivityCurrent = environment === 'wet' ? 15 : 30;
  const operatingTime = '0.1秒以内 (高速形)';
  const isMandatory = environment === 'wet';

  const description = isMandatory
    ? '感電防止のため、高感度高速形（15mA・0.1秒以内）の漏電遮断器を必ず選定してください。'
    : '標準的な感電・火災防止用の漏電遮断器（30mA・0.1秒以内）です。';

  return {
    recommendedAmp,
    sensitivityCurrent,
    operatingTime,
    isMandatory,
    description,
  };
}

/** 3. 進相コンデンサ (Capacitor) 計算関数 */
export function calculatePhaseCapacitor(
  kw: number,
  currentCos: number,
  targetCos: number = 0.95,
  voltage: number = 200
): CapacitorSelectionResult {
  if (currentCos >= targetCos || currentCos <= 0 || targetCos >= 1.0) {
    return {
      requiredKvar: 0,
      recommendedKvar: 0,
      recommendedMicroFarad: 0,
      improvedPowerFactor: currentCos,
      dischargeResistorNote: '力率改善の必要はありません。',
    };
  }

  const tan1 = Math.sqrt(1 - Math.pow(currentCos, 2)) / currentCos;
  const tan2 = Math.sqrt(1 - Math.pow(targetCos, 2)) / targetCos;

  const rawKvar = kw * (tan1 - tan2);
  const requiredKvar = Number(rawKvar.toFixed(2));

  const STANDARD_CAPACITORS = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  const recommendedKvar =
    STANDARD_CAPACITORS.find((c) => c >= requiredKvar) ||
    STANDARD_CAPACITORS[STANDARD_CAPACITORS.length - 1];

  // 三相Delta結線における推奨静電容量 C [μF] 算出 (60Hz想定)
  // C = (Q * 10^9) / (2 * π * f * V^2 * 3)
  const freq = 60;
  const recommendedMicroFarad = Math.round(
    (recommendedKvar * 1000 * 1000000) / (2 * Math.PI * freq * Math.pow(voltage, 2) * 3)
  );

  return {
    requiredKvar,
    recommendedKvar,
    recommendedMicroFarad,
    improvedPowerFactor: targetCos,
    dischargeResistorNote:
      'コンデンサ開放時の残留電荷放電のため、自動放電装置付き（または放電抵抗内蔵形）を選定してください。高調波対策が必要な場合は直列リアクトル（6%）を併設します。',
  };
}