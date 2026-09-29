// src/utils/breakerSelect.ts

import {
  BreakerSelectParams,
  MotorBreakerSelectionResult,
  ElcbSelectionResult,
  EnvironmentType,
  GeneralBreakerParams,
  GeneralBreakerResult,
  BreakerBaseComprehensiveResult
} from '@/base/breakerBase';
import {
  selectExtendedMotorBreaker,
  selectExtendedElcb,
  selectGeneralBreaker as baseSelectGeneralBreaker,
  selectComprehensiveBreakers as baseSelectComprehensiveBreakers
} from '@/base/breakerBase';

/**
 * 配線用遮断器（MCCB）/ モーターブレーカー選定処理（内線規程 第148条・3705-8準拠）
 */
export function selectMotorBreaker(params: BreakerSelectParams): MotorBreakerSelectionResult {
  const ext = selectExtendedMotorBreaker(params);
  return {
    selectedType: ext.selectedType,
    recommendedAmp: ext.recommendedAmp,
    requiresThermalRelay: ext.requiresThermalRelay,
    isOver15kW: ext.isOver15kW,
    warningNote: ext.warningNote
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
  const ext = selectExtendedElcb(params);
  return {
    recommendedAmp: ext.recommendedAmp,
    sensitivityCurrent: ext.sensitivityCurrent,
    operatingTime: ext.operatingTime,
    maxGroundResistance: ext.maxGroundResistance,
    isMandatory: ext.isMandatory,
    description: ext.description
  };
}

/**
 * 一般負荷用配線用遮断器選定
 */
export function selectGeneralBreaker(params: GeneralBreakerParams): GeneralBreakerResult {
  return baseSelectGeneralBreaker(params);
}

/**
 * 総合一括選定関数
 */
export function selectComprehensiveBreakers(params: BreakerSelectParams): BreakerBaseComprehensiveResult {
  return baseSelectComprehensiveBreakers(params);
}