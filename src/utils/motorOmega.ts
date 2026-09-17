import {
  EnvironmentType,
  GroundingResult,
  ElcbSelectionResult,
  CapacitorSelectionResult,
  MOTOR_CAPACITOR_TABLE_200V,
} from '@/types/appDefinitions';

/**
 * 電動機用接地工事および絶縁抵抗の判定
 */
export function calculateMotorGrounding(
  voltage: number,
  environment: EnvironmentType
): GroundingResult {
  const isHighVoltage = voltage > 300;
  const groundType = isHighVoltage ? 'C種接地工事' : 'D種接地工事';
  const groundResistance = isHighVoltage ? 10 : 100;
  const allowableResistanceWithElcb = 500;
  const insulationResistance = isHighVoltage ? 0.4 : 0.2;
  const groundWireDiameter = isHighVoltage ? '1.6mm以上 (推奨2.0mm)' : '1.6mm以上';
  const requiresELCB = environment === 'wet' || environment === 'enclosure';

  const notes: string[] = [];
  if (isHighVoltage) {
    notes.push('対地電圧が300Vを超えるため、C種接地工事が必要です。');
  }
  if (environment === 'wet') {
    notes.push('水気・湿気のある場所での設置のため、高感度高速形漏電遮断器の設置が義務付けられています。');
  } else if (environment === 'enclosure') {
    notes.push('金属製外箱内に設置する場合、適切な接地と漏電遮断器による保護が必要です。');
  }

  return {
    groundType,
    groundResistance,
    allowableResistanceWithElcb,
    insulationResistance,
    groundWireDiameter,
    requiresELCB,
    notes,
  };
}

/**
 * 電動機用漏電遮断器 (ELCB) の選定
 */
export function selectMotorELCB(
  calculatedAmp: number,
  environment: EnvironmentType,
  breakerSizes: number[]
): ElcbSelectionResult {
  const targetAmp = calculatedAmp * 1.5;
  const recommendedAmp =
    breakerSizes.find((s) => s >= targetAmp) || breakerSizes[breakerSizes.length - 1];

  const isMandatory = environment === 'wet';
  const sensitivityCurrent = isMandatory ? 15 : 30; // 水気のある場所は15mA、通常は30mA
  const operatingTime = '0.1秒以内';

  let description = '電動機保護用または漏電保護専用の動作特性を持つELCBを選定してください。';
  if (isMandatory) {
    description = '水気・湿気のある場所のため、15mA高感度高速形の漏電遮断器の設置が必須です。';
  }

  return {
    recommendedAmp,
    sensitivityCurrent,
    operatingTime,
    isMandatory,
    description,
  };
}

/**
 * 進相コンデンサ (力率改善) の計算
 */
export function calculatePhaseCapacitor(
  outputKw: number,
  powerFactor: number,
  targetPowerFactor: number,
  voltage: number,
  frequency: number = 50
): CapacitorSelectionResult {
  // 第1表 (200V) テーブル照会
  let isTableStandard = false;
  let tableMatch = MOTOR_CAPACITOR_TABLE_200V.find((entry) => entry.kw === outputKw);

  // 理論計算 (Q = P * (tan(acos(pf1)) - tan(acos(pf2))))
  const pf1 = Math.min(Math.max(powerFactor, 0.1), 0.99);
  const pf2 = Math.min(Math.max(targetPowerFactor, pf1), 1.0);
  const tan1 = Math.tan(Math.acos(pf1));
  const tan2 = Math.tan(Math.acos(pf2));
  const requiredKvar = Number((outputKw * (tan1 - tan2)).toFixed(2));

  let recommendedKvar = requiredKvar;
  let recommendedMicroFarad = 0;

  if (voltage === 200 && tableMatch) {
    isTableStandard = true;
    if (frequency === 60) {
      recommendedKvar = tableMatch.kvar60Hz;
      recommendedMicroFarad = tableMatch.uf60Hz;
    } else {
      recommendedKvar = tableMatch.kvar50Hz;
      recommendedMicroFarad = tableMatch.uf50Hz;
    }
  } else {
    // 汎用μF計算: C = Q / (2 * π * f * V^2)
    const qVar = requiredKvar * 1000;
    const omega = 2 * Math.PI * frequency;
    if (omega > 0 && voltage > 0) {
      const farad = qVar / (omega * Math.pow(voltage, 2));
      recommendedMicroFarad = Math.round(farad * 1e6);
    }
  }

  const dischargeResistorNote =
    'コンデンサ開放時の残留電荷による感電防止のため、放電抵抗（または自動放電装置）を内蔵または並列接続してください。';

  return {
    requiredKvar,
    recommendedKvar,
    recommendedMicroFarad,
    improvedPowerFactor: targetPowerFactor,
    dischargeResistorNote,
    isTableStandard,
  };
}