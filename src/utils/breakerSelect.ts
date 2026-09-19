// src/utils/breakerSelect.ts
import {
  THREE_PHASE_BREAKER_SIZES,
  MotorBreakerType,
  MotorBreakerSelectionResult,
  EnvironmentType,
} from '@/types/appDefinitions';

export interface BreakerSelectParams {
  outputKw: number;
  singleAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  wireAllowAmp?: number; // 幹線電線の許容電流 IW (A) を追加
  breakerTypeMode: MotorBreakerType;
  driveMode: 'direct' | 'inverter';
  environment?: EnvironmentType;
}

export interface ElcbSelectionResult {
  recommendedAmp: number;
  sensitivityCurrent: number;
  operatingTime: string;
  isMandatory: boolean;
  description: string;
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
  // ※ 複数台(motorCount > 1)であってもモーターブレーカーを選択できるように、強制MCCBの条件から除外
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
    // 【単体・または個別モーターブレーカー選定】
    // ※通常、個別保護用としては1台あたりの定格電流をベースに選定しますが、
    //   複数台一括や回路仕様に合わせて合計または個別で算出します。ここでは単体電流ベース、または合計ベースを柔軟に。
    //   一般的には個別モーターブレーカーなので singleAmp をベースにするか、用途に合わせて選択。
    //   ここでは安全側に「1台あたりの定格電流(singleAmp)」をベースに個別MBサイズを選定するように調整します。
    const targetBaseAmp = singleAmp; 
    recommendedAmp = THREE_PHASE_BREAKER_SIZES.find((s) => s >= targetBaseAmp) || 20;
    if (recommendedAmp < 20) recommendedAmp = 20;
  } else {
    // 【上位配線用遮断器（MCCB）選定：内線規程 3705-8】
    const motorFactor = totalMotorAmp <= 50 ? 3.0 : 2.75;
    const limitByLoad = totalMotorAmp * motorFactor + otherLoadAmp;
    
    // 幹線許容電流制限 (2.5 * IW)
    const limitByWire = (wireAllowAmp && wireAllowAmp > 0) ? 2.5 * wireAllowAmp : Infinity;
    const maxAllowedAmp = Math.min(limitByLoad, limitByWire);

    // 負荷電流をカバーしつつ上限値(maxAllowedAmp)を超えないサイズを選定
    const validSizes = THREE_PHASE_BREAKER_SIZES.filter((s) => s <= maxAllowedAmp);
    recommendedAmp = validSizes.length > 0 ? validSizes[validSizes.length - 1] : 30;
    
    if (recommendedAmp < 30) recommendedAmp = 30;
  }

  const requiresThermalRelay = selectedType === 'mccb';

  // 警告・補足説明文の設定
  let warningNote: string | undefined = undefined;
  if (isOver15kW) {
    warningNote =
      '15kWを超える電動機のため、個別保護用モーターブレーカーは使用できません。上位配線用遮断器（MCCB）と個別のサーマルリレーを併用してください。';
  } else if (selectedType === 'motor_breaker' && motorCount > 1) {
    warningNote = `電動機${motorCount}台それぞれに個別モーターブレーカー（各台定格基準・推奨${recommendedAmp}A × ${motorCount}台）を選定しています。`;
  } else if (motorCount > 1 || otherLoadAmp > 0) {
    warningNote = `電動機${motorCount}台（合計${totalMotorAmp.toFixed(
      1
    )}A）の上位幹線遮断器として定格${recommendedAmp}Aを選定しています。`;
  } else if (selectedType === 'mccb') {
    warningNote =
      '配線用遮断器（MCCB）を使用する場合は、電動機保護のためサーマルリレー（電磁開閉器）の併設が必要です。';
  }

  return {
    selectedType,
    recommendedAmp,
    requiresThermalRelay,
    isOver15kW,
    warningNote,
  };
}

/**
 * 漏電遮断器 (ELCB) 選定処理
 */
export function selectElcb(params: BreakerSelectParams): ElcbSelectionResult {
  const { singleAmp, motorCount, otherLoadAmp, wireAllowAmp, environment } = params;

  const totalMotorAmp = singleAmp * motorCount;
  const motorFactor = totalMotorAmp <= 50 ? 3.0 : 2.75;
  const limitByLoad = totalMotorAmp * motorFactor + otherLoadAmp;

  const limitByWire = (wireAllowAmp && wireAllowAmp > 0) ? 2.5 * wireAllowAmp : Infinity;
  const maxAllowedAmp = Math.min(limitByLoad, limitByWire);

  const validSizes = THREE_PHASE_BREAKER_SIZES.filter((s) => s <= maxAllowedAmp);
  let selectedAmp = validSizes.length > 0 ? validSizes[validSizes.length - 1] : 30;

  if (selectedAmp < 30) {
    selectedAmp = 30;
  }

  let sensitivityCurrent = 30;
  if (environment === 'wet') {
    sensitivityCurrent = 15;
  } else if (selectedAmp > 50) {
    sensitivityCurrent = 100;
  }

  return {
    recommendedAmp: selectedAmp,
    sensitivityCurrent,
    operatingTime: '0.1秒以内',
    isMandatory: environment === 'wet',
    description:
      motorCount > 1 || otherLoadAmp > 0
        ? `内線規程3705-8準拠（制限上限: ${maxAllowedAmp.linejoin ? '' : maxAllowedAmp.toFixed(1)}A）：電動機${motorCount}台（合計${totalMotorAmp.toFixed(
            1
          )}A）の上位幹線用ELCB（定格${selectedAmp}A）を選定しています。`
        : `内線規程準拠：電動機回路に対応する標準ELCB（定格${selectedAmp}A）を選定しています。`,
  };
}