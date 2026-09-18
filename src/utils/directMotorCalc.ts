// utils/directMotorCalc.ts
import {
  THREE_PHASE_BREAKER_SIZES,
  EnvironmentType,
  PowerFrequency,
  MotorBreakerType,
  MotorBreakerSelectionResult,
  GroundingResult,
  ElcbSelectionResult,
  CapacitorSelectionResult,
} from '@/types/appDefinitions';
import {
  calculateMotorGrounding,
  selectMotorELCB,
  calculatePhaseCapacitor,
} from '@/utils/motorOmega';

/**
 * 非インバータ（商用電源直結）電動機計算の入力パラメータ型定義
 */
export interface DirectMotorCalcParams {
  outputKw: number;
  voltage: number;
  powerFactor: number;
  targetPowerFactor: number;
  efficiency: number;
  environment: EnvironmentType;
  frequency: PowerFrequency;
  breakerTypeMode?: MotorBreakerType;
}

/**
 * 非インバータ（商用電源直結）電動機計算の出力結果型定義
 */
export interface DirectMotorCalcResult {
  calculatedAmp: number;
  simpleAmp: number;
  requiredWireAmp: number;
  breakerCapacity: {
    rawTarget: number;
    recommended: number;
  };
  breakerInfo: MotorBreakerSelectionResult;
  groundingInfo: GroundingResult;
  elcbInfo: ElcbSelectionResult;
  capacitorInfo: CapacitorSelectionResult;
}

/**
 * 1. 定格電流の計算 (商用電源直結)
 * 公式: In = (P * 1000) / (√3 * V * cosθ * η)
 */
export function calculateDirectMotorAmp(
  outputKw: number,
  voltage: number,
  powerFactor: number,
  efficiency: number
): number {
  const pWatt = outputKw * 1000;
  const denominator = Math.sqrt(3) * voltage * powerFactor * efficiency;
  if (denominator <= 0) return 0;
  return Number((pWatt / denominator).toFixed(2));
}

/**
 * 2. 簡易目安電流の計算 (kWあたりの固定倍率)
 * 200V系: kW * 4 / 400V系: kW * 2
 */
export function calculateDirectSimpleAmp(outputKw: number, voltage: number): number {
  if (voltage >= 400) {
    return Number((outputKw * 2).toFixed(1));
  }
  return Number((outputKw * 4).toFixed(1));
}

/**
 * 3. 電線選定用 許容電流基準の計算
 * 内線規程基準: 50A以下は1.25倍、50A超は1.1倍
 */
export function calculateDirectRequiredWireAmp(calculatedAmp: number): number {
  if (calculatedAmp <= 50) {
    return Number((calculatedAmp * 1.25).toFixed(2));
  }
  return Number((calculatedAmp * 1.1).toFixed(2));
}

/**
 * 4. 配線用遮断器 (MCCB) / モーターブレーカー容量の計算
 * 商用直結時は直列始動電流 (約5〜6倍) を考慮し、定格電流の3.0倍 (3倍則) を基準とする
 */
export function calculateDirectBreakerCapacity(calculatedAmp: number): {
  rawTarget: number;
  recommended: number;
} {
  const target = calculatedAmp * 3.0;
  const recommended =
    THREE_PHASE_BREAKER_SIZES.find((s) => s >= target) ||
    THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];

  return {
    rawTarget: Number(target.toFixed(1)),
    recommended,
  };
}

/**
 * 5. モーターブレーカー / MCCB 詳細選定ロジック
 * 15kW超の電動機はモーターブレーカー適用不可 (MCCB + サーマルリレーの構成が必須)
 */
export function selectDirectMotorBreaker(
  outputKw: number,
  calculatedAmp: number,
  breakerTypeMode: MotorBreakerType = 'auto'
): MotorBreakerSelectionResult {
  const isOver15kW = outputKw > 15.0;

  let selectedType: 'motor_breaker' | 'mccb' = 'motor_breaker';
  if (isOver15kW) {
    selectedType = 'mccb';
  } else if (breakerTypeMode === 'auto') {
    selectedType = 'motor_breaker';
  } else {
    selectedType = breakerTypeMode;
  }

  const { recommended } = calculateDirectBreakerCapacity(calculatedAmp);
  const requiresThermalRelay = selectedType === 'mccb';

  let warningNote: string | undefined = undefined;
  if (isOver15kW) {
    warningNote =
      '15kWを超える電動機のため、モーターブレーカーは使用できません。配線用遮断器（MCCB）とサーマルリレーを併用してください。';
  } else if (selectedType === 'mccb') {
    warningNote =
      '配線用遮断器（MCCB）を使用する場合は、電動機保護のためサーマルリレー（電磁開閉器）の併設が必要です。';
  }

  return {
    selectedType,
    recommendedAmp: recommended,
    requiresThermalRelay,
    isOver15kW,
    warningNote,
  };
}

/**
 * 商用直結（非インバータ）全計算を一括実行する統合エントリー関数
 */
export function processDirectMotorCalc(params: DirectMotorCalcParams): DirectMotorCalcResult {
  const {
    outputKw,
    voltage,
    powerFactor,
    targetPowerFactor,
    efficiency,
    environment,
    frequency,
    breakerTypeMode = 'auto',
  } = params;

  // 1. 各種電流計算
  const calculatedAmp = calculateDirectMotorAmp(outputKw, voltage, powerFactor, efficiency);
  const simpleAmp = calculateDirectSimpleAmp(outputKw, voltage);
  const requiredWireAmp = calculateDirectRequiredWireAmp(calculatedAmp);

  // 2. 遮断器選定
  const breakerCapacity = calculateDirectBreakerCapacity(calculatedAmp);
  const breakerInfo = selectDirectMotorBreaker(outputKw, calculatedAmp, breakerTypeMode);

  // 3. 接地工事・漏電遮断器・進相コンデンサ計算
  const groundingInfo = calculateMotorGrounding(voltage, environment);
  const elcbInfo = selectMotorELCB(calculatedAmp, environment, THREE_PHASE_BREAKER_SIZES);
  const capacitorInfo = calculatePhaseCapacitor(
    outputKw,
    powerFactor,
    targetPowerFactor,
    voltage,
    frequency
  );

  return {
    calculatedAmp,
    simpleAmp,
    requiredWireAmp,
    breakerCapacity,
    breakerInfo,
    groundingInfo,
    elcbInfo,
    capacitorInfo,
  };
}