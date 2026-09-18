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
  
    let recommendedAmp = 30;
  
    if (selectedType === 'motor_breaker') {
      // 【単体モーターブレーカー選定】
      // 定格電流と同等以上の直近上位サイズを選定（最小20A）
      recommendedAmp = THREE_PHASE_BREAKER_SIZES.find((s) => s >= totalMotorAmp) || 20;
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
    } else if (motorCount > 1 || otherLoadAmp > 0) {
      warningNote = `電動機${motorCount}台（合計${totalMotorAmp.toFixed(
        1
      )}A）の上位幹線遮断器として定格${recommendedAmp}Aを選定しています。内線規程第148条に基づき、末端の各個別の電動機回路にはモーターブレーカー（MB）等を設置してください。`;
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
   * 漏電遮断器 (ELCB) 選定処理（内線規程 第148条 3705-8幹線の過電流保護準拠）
   */
  export function selectElcb(params: BreakerSelectParams): ElcbSelectionResult {
    const { singleAmp, motorCount, otherLoadAmp, wireAllowAmp, environment } = params;
  
    const totalMotorAmp = singleAmp * motorCount;
    const motorFactor = totalMotorAmp <= 50 ? 3.0 : 2.75;
    const limitByLoad = totalMotorAmp * motorFactor + otherLoadAmp;
  
    // 幹線許容電流制限 (2.5 * IW)
    const limitByWire = (wireAllowAmp && wireAllowAmp > 0) ? 2.5 * wireAllowAmp : Infinity;
    const maxAllowedAmp = Math.min(limitByLoad, limitByWire);
  
    // 規程の上限値(maxAllowedAmp)を超えないサイズを選定（最小30A）
    const validSizes = THREE_PHASE_BREAKER_SIZES.filter((s) => s <= maxAllowedAmp);
    let selectedAmp = validSizes.length > 0 ? validSizes[validSizes.length - 1] : 30;
  
    if (selectedAmp < 30) {
      selectedAmp = 30;
    }
  
    // 感度電流設定
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
          ? `内線規程3705-8準拠（制限上限: ${maxAllowedAmp.toFixed(1)}A）：電動機${motorCount}台（合計${totalMotorAmp.toFixed(
              1
            )}A、個別MB＋コンデンサ前提）の上位幹線用ELCB（定格${selectedAmp}A）を選定しています。`
          : `内線規程準拠：電動機回路に対応する標準ELCB（定格${selectedAmp}A）を選定しています。`,
    };
  }