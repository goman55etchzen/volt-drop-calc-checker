// src/utils/breakerSelect.ts
import {
  THREE_PHASE_BREAKER_SIZES,
  MotorBreakerType,
  MotorBreakerSelectionResult,
  EnvironmentType,
  ElcbSelectionResult,
} from '@/types/appDefinitions';

export interface BreakerSelectParams {
  outputKw: number;
  singleAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  wireAllowAmp?: number; // 幹線電線の許容電流 IW (A)
  breakerTypeMode: MotorBreakerType;
  driveMode: 'direct' | 'inverter';
  environment?: EnvironmentType;
}

/**
 * 配線用遮断器（MCCB）/ モーターブレーカー選定処理（内線規程 第148条・3705-8準拠）
 */
export function selectMotorBreaker(params: BreakerSelectParams): MotorBreakerSelectionResult {
  const { outputKw, singleAmp, motorCount, otherLoadAmp, wireAllowAmp, breakerTypeMode, driveMode } = params;

  // 全電動機の定格電流の合計 (∑IM)
  const totalMotorAmp = singleAmp * motorCount;
  const isOver15kW = outputKw > 15.0;

  // 種別自動判定および手動指定の調整
  let selectedType: 'motor_breaker' | 'mccb' = 'motor_breaker';
  if (
    driveMode === 'inverter' ||
    isOver15kW ||
    otherLoadAmp > 0 ||
    breakerTypeMode === 'mccb'
  ) {
    selectedType = 'mccb';
  } else if (breakerTypeMode === 'auto') {
    selectedType = 'motor_breaker';
  } else {
    selectedType = breakerTypeMode;
  }

  let recommendedAmp = 30;

  if (selectedType === 'motor_breaker') {
    // 【単体モーターブレーカー選定】
    const targetBaseAmp = singleAmp;
    recommendedAmp = THREE_PHASE_BREAKER_SIZES.find((s) => s >= targetBaseAmp) || 20;
    if (recommendedAmp < 20) recommendedAmp = 20;
  } else {
    // 【配線用遮断器（MCCB）選定：内線規程 3705-8】
    const motorFactor = totalMotorAmp <= 50 ? 3.0 : 2.75;
    const limitByLoad = totalMotorAmp * motorFactor + otherLoadAmp;

    // 幹線許容電流制限 (2.5 * IW)
    const limitByWire = (wireAllowAmp && wireAllowAmp > 0) ? 2.5 * wireAllowAmp : Infinity;
    const maxAllowedAmp = Math.min(limitByLoad, limitByWire);

    const MIN_BREAKER = 30;
    recommendedAmp = THREE_PHASE_BREAKER_SIZES.find((s) => s >= limitByLoad)
      || THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];

    if (wireAllowAmp && wireAllowAmp > 0 && recommendedAmp > limitByWire) {
      const validSizes = THREE_PHASE_BREAKER_SIZES.filter((s) => s <= limitByWire);
      recommendedAmp = validSizes.length > 0 ? validSizes[validSizes.length - 1] : MIN_BREAKER;
    }

    if (recommendedAmp < MIN_BREAKER) {
      recommendedAmp = MIN_BREAKER;
    }
  }

  // サーマルリレー必要判定
  const requiresThermalRelay = selectedType === 'mccb' || driveMode === 'inverter' || isOver15kW;

  // 警告・注意メッセージの生成
  const notes: string[] = [];
  if (isOver15kW) {
    notes.push('15kWを超える電動機のため配線用遮断器(MCCB)+サーマルリレーの組み合わせを推奨します。');
  }
  if (driveMode === 'inverter') {
    notes.push('インバータ駆動回路のため高周波対応の漏電遮断器・過電流保護機器を選定してください。');
  }
  if (otherLoadAmp > 0 && selectedType === 'motor_breaker') {
    notes.push('他負荷が混在しているためMCCBによる一括保護を推奨します。');
  }

  return {
    selectedType,
    recommendedAmp,
    requiresThermalRelay,
    isOver15kW,
    warningNote: notes.join(' ')
  };
}

/**
 * 漏電遮断器選定ヘルパー関数（内線規程 3705-8準拠）
 */
export function selectElcb(params: {
  motorAmp: number;
  otherLoadAmp: number;
  wireAllowAmp: number;
  environment?: EnvironmentType;
}): ElcbSelectionResult {
  const { motorAmp, otherLoadAmp, wireAllowAmp, environment = 'normal' } = params;

  const motorFactor = motorAmp <= 50 ? 3.0 : 2.75;
  const limitByLoad = motorFactor * motorAmp + otherLoadAmp;
  const limitByWire = wireAllowAmp > 0 ? 2.5 * wireAllowAmp : Infinity;

  const MIN_BREAKER_SIZE = 30;
  let recommendedAmp = THREE_PHASE_BREAKER_SIZES.find((size) => size >= limitByLoad) 
    ?? THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];

  if (wireAllowAmp > 0 && recommendedAmp > limitByWire) {
    const validSizes = THREE_PHASE_BREAKER_SIZES.filter((size) => size <= limitByWire);
    recommendedAmp = validSizes.length > 0 ? validSizes[validSizes.length - 1] : MIN_BREAKER_SIZE;
  }

  if (recommendedAmp < MIN_BREAKER_SIZE) {
    recommendedAmp = MIN_BREAKER_SIZE;
  }

  const isMandatory = environment === 'wet';
  const sensitivityCurrent = isMandatory ? 15 : (recommendedAmp > 50 ? 100 : 30);
  const operatingTime = '0.1秒以内（高速形）';
  const maxGroundResistance = sensitivityCurrent === 15 ? 1000 : (sensitivityCurrent === 30 ? 500 : 150);

  const totalLoad = motorAmp + otherLoadAmp;
  let description = '';

  if (isMandatory) {
    description = `水気・湿気のある場所の回路です（負荷合計: ${totalLoad.toFixed(1)}A）。内線規程3705-8準拠（制限目標: ${limitByLoad.toFixed(1)}A）で定格電流${recommendedAmp}A、感度15mA以下の高感度高速形ELCBの設置が必須です。`;
  } else if (environment === 'enclosure') {
    description = `金属外箱収納回路です（負荷合計: ${totalLoad.toFixed(1)}A）。内線規程3705-8準拠により定格電流${recommendedAmp}A、感度${sensitivityCurrent}mAの高速形ELCBを選定しています。`;
  } else {
    description = `内線規程3705-8（3×∑IM＋∑IL ≤ ${limitByLoad.toFixed(1)}A）に基づき、定格電流${recommendedAmp}A（感度${sensitivityCurrent}mA）のELCBを選定しています。`;
  }

  return {
    recommendedAmp,
    sensitivityCurrent,
    operatingTime,
    maxGroundResistance,
    isMandatory,
    description
  };
}