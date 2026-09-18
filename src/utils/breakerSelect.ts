// utils/breakerSelect.ts
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
   * 配線用遮断器（MCCB）/ モーターブレーカー選定処理
   */
  export function selectMotorBreaker(params: BreakerSelectParams): MotorBreakerSelectionResult {
    const { outputKw, singleAmp, motorCount, otherLoadAmp, breakerTypeMode, driveMode } = params;
  
    const totalMotorAmp = singleAmp * motorCount;
    const isOver15kW = outputKw > 15.0;
  
    // 種別自動判定および手動指定の調整
    let selectedType: 'motor_breaker' | 'mccb' = 'motor_breaker';
    if (
      driveMode === 'inverter' ||
      isOver15kW ||
      motorCount > 1 ||
      otherLoadAmp > 0 ||
      breakerTypeMode === 'mccb'
    ) {
      selectedType = 'mccb';
    } else if (breakerTypeMode === 'auto') {
      selectedType = 'motor_breaker';
    } else {
      selectedType = breakerTypeMode;
    }
  
    // 内線規程：過電流遮断器容量 (3 * Im + Ir)
    const target = totalMotorAmp * 3.0 + otherLoadAmp;
  
    // 三相3線式用の遮断器定格サイズから選定（実用最小30A）
    const RECOMMENDED_MIN_AMP = 30;
    let recommendedAmp =
      THREE_PHASE_BREAKER_SIZES.find((s) => s >= target) ||
      THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];
  
    if (recommendedAmp < RECOMMENDED_MIN_AMP) {
      recommendedAmp = RECOMMENDED_MIN_AMP;
    }
  
    const requiresThermalRelay = selectedType === 'mccb';
  
    let warningNote: string | undefined = undefined;
    if (isOver15kW) {
      warningNote =
        '15kWを超える電動機のため、モーターブレーカーは使用できません。配線用遮断器（MCCB）とサーマルリレーを併用してください。';
    } else if (motorCount > 1 || otherLoadAmp > 0) {
      warningNote =
        '複数台運転または他負荷併設のため、個別モーター保護用にサーマルリレー（電磁開閉器）の併設が必要です。';
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
    const { singleAmp, motorCount, otherLoadAmp, environment } = params;
  
    const totalMotorAmp = singleAmp * motorCount;
    const rawTargetAmp = totalMotorAmp * 3.0 + otherLoadAmp;
    const totalLoadAmp = totalMotorAmp + otherLoadAmp;
  
    const RECOMMENDED_MIN_AMP = 30;
    let selectedAmp = THREE_PHASE_BREAKER_SIZES.find((s) => s >= rawTargetAmp) || 300;
    if (selectedAmp < RECOMMENDED_MIN_AMP) {
      selectedAmp = RECOMMENDED_MIN_AMP;
    }
  
    const sensitivityCurrent = selectedAmp <= 50 ? 30 : 100;
  
    return {
      recommendedAmp: selectedAmp,
      sensitivityCurrent,
      operatingTime: '0.1秒以内',
      isMandatory: environment === 'wet',
      description:
        motorCount > 1 || otherLoadAmp > 0
          ? `電動機${motorCount}台＋他負荷（合計${totalLoadAmp.toFixed(1)}A）に対応する3P3W標準漏電遮断器を選定しています。`
          : '三相3線式標準の電動機保護用または漏電保護用ELCBを選定しています。',
    };
  }