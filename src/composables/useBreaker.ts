// src/composables/useBreaker.ts

import { computed, type Ref, isRef, ref } from "vue";
import {
  type MotorBreakerType,
  type EnvironmentType,
  type MotorBreakerSelectionResult,
  type ElcbSelectionResult,
  type ExtendedMotorBreakerResult,
  type ExtendedElcbResult,
  type BreakerSelectParams,
  type GeneralBreakerParams,
  type GeneralBreakerResult,
  type BreakerBaseComprehensiveResult,
  selectExtendedMotorBreaker,
  selectExtendedElcb,
  selectGeneralBreaker as baseSelectGeneralBreaker,
  selectComprehensiveBreakers as baseSelectComprehensiveBreakers,
} from "@/base/breakerBase";

export interface UseBreakerOptions {
  outputKw: Ref<number> | number;
  singleAmp: Ref<number> | number;
  motorCount: Ref<number> | number;
  otherLoadAmp: Ref<number> | number;
  wireAllowAmp?: Ref<number> | number;
  breakerTypeMode: Ref<MotorBreakerType> | MotorBreakerType;
  driveMode: Ref<"direct" | "inverter"> | "direct" | "inverter";
  environment?: Ref<EnvironmentType> | EnvironmentType;
}

/**
 * Vue 3 リアクティブコンポーネント向けブレーカー・ELCB一括選定 Composable
 */
export function useBreaker(options: UseBreakerOptions) {
  const getVal = <T>(val: Ref<T> | T | undefined, fallback: T): T => {
    if (val === undefined) return fallback;
    return isRef(val) ? val.value : val;
  };

  const extendedBreakerInfo = computed<ExtendedMotorBreakerResult>(() => {
    const params: BreakerSelectParams = {
      outputKw: getVal(options.outputKw, 0),
      singleAmp: getVal(options.singleAmp, 0),
      motorCount: getVal(options.motorCount, 1),
      otherLoadAmp: getVal(options.otherLoadAmp, 0),
      wireAllowAmp: getVal(options.wireAllowAmp, 0),
      breakerTypeMode: getVal(options.breakerTypeMode, "auto"),
      driveMode: getVal(options.driveMode, "direct"),
      environment: getVal(options.environment, "normal"),
    };
    return selectExtendedMotorBreaker(params);
  });

  const breakerInfo = computed<MotorBreakerSelectionResult>(() => {
    const ext = extendedBreakerInfo.value;
    return {
      selectedType: ext.selectedType,
      recommendedAmp: ext.recommendedAmp,
      requiresThermalRelay: ext.requiresThermalRelay,
      isOver15kW: ext.isOver15kW,
      warningNote: ext.warningNote,
    };
  });

  const extendedElcbInfo = computed<ExtendedElcbResult>(() => {
    const motorAmp =
      getVal(options.singleAmp, 0) * getVal(options.motorCount, 1);
    const otherLoadAmp = getVal(options.otherLoadAmp, 0);
    const wireAllowAmp = getVal(options.wireAllowAmp, 0);
    const environment = getVal(options.environment, "normal");

    return selectExtendedElcb({
      motorAmp,
      otherLoadAmp,
      wireAllowAmp,
      environment,
    });
  });

  const elcbInfo = computed<ElcbSelectionResult>(() => {
    const ext = extendedElcbInfo.value;
    return {
      recommendedAmp: ext.recommendedAmp,
      sensitivityCurrent: ext.sensitivityCurrent,
      operatingTime: ext.operatingTime,
      maxGroundResistance: ext.maxGroundResistance,
      isMandatory: ext.isMandatory,
      description: ext.description,
    };
  });

  const comprehensiveResult = computed<BreakerBaseComprehensiveResult>(() => {
    return {
      motorBreaker: extendedBreakerInfo.value,
      elcb: extendedElcbInfo.value,
      summaryNotes: [
        ...(extendedBreakerInfo.value.warningNote
          ? [extendedBreakerInfo.value.warningNote]
          : []),
        ...(extendedElcbInfo.value.isMandatory
          ? ["感電防止のため高感度形ELCBの設置が法令・規定上必須です。"]
          : []),
      ],
    };
  });

  return {
    breakerInfo,
    extendedBreakerInfo,
    elcbInfo,
    extendedElcbInfo,
    comprehensiveResult,
  };
}

// ==========================================
// 非リアクティブ単体選定ユーティリティ（従来のbreakerSelect.tsの互換代替）
// ==========================================

export function selectMotorBreaker(
  params: BreakerSelectParams,
): MotorBreakerSelectionResult {
  const ext = selectExtendedMotorBreaker(params);
  return {
    selectedType: ext.selectedType,
    recommendedAmp: ext.recommendedAmp,
    requiresThermalRelay: ext.requiresThermalRelay,
    isOver15kW: ext.isOver15kW,
    warningNote: ext.warningNote,
  };
}

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
    description: ext.description,
  };
}

export function selectGeneralBreaker(
  params: GeneralBreakerParams,
): GeneralBreakerResult {
  return baseSelectGeneralBreaker(params);
}

export function selectComprehensiveBreakers(
  params: BreakerSelectParams,
): BreakerBaseComprehensiveResult {
  return baseSelectComprehensiveBreakers(params);
}