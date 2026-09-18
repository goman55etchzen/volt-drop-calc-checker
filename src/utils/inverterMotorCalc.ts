// utils/inverterMotorCalc.ts
import {
    BREAKER_SIZES,
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
  } from '@/utils/motorOmega';
  
  /**
   * インバータ駆動 電動機計算の入力パラメータ型定義
   */
  export interface InverterMotorCalcParams {
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
   * インバータ駆動 電動機計算の出力結果型定義
   */
  export interface InverterMotorCalcResult {
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
   * 1. 定格一次電流の計算 (インバータ一次側)
   * 公式: In = (P * 1000) / (√3 * V * cosθ * η)
   */
  export function calculateInverterMotorAmp(
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
   * 2. 簡易目安電流の計算
   */
  export function calculateInverterSimpleAmp(outputKw: number, voltage: number): number {
    if (voltage >= 400) {
      return Number((outputKw * 2).toFixed(1));
    }
    return Number((outputKw * 4).toFixed(1));
  }
  
  /**
   * 3. 電線選定用 許容電流基準の計算
   * 内線規程基準 (インバータ一次側電線選定)
   */
  export function calculateInverterRequiredWireAmp(calculatedAmp: number): number {
    if (calculatedAmp <= 50) {
      return Number((calculatedAmp * 1.25).toFixed(2));
    }
    return Number((calculatedAmp * 1.1).toFixed(2));
  }
  
  /**
   * 4. 配線用遮断器 (MCCB) 容量の計算
   * インバータ駆動時は始動電流が抑制されるため、直入始動用の3倍則（3.0倍）ではなく
   * インバータ容量・過負荷耐力を考慮した1.3〜1.5倍（ここでは基準1.4倍）で選定します。
   */
  export function calculateInverterBreakerCapacity(calculatedAmp: number): {
    rawTarget: number;
    recommended: number;
  } {
    const target = calculatedAmp * 1.4;
    const recommended =
      BREAKER_SIZES.find((s) => s >= target) || BREAKER_SIZES[BREAKER_SIZES.length - 1];
  
    return {
      rawTarget: Number(target.toFixed(1)),
      recommended,
    };
  }
  
  /**
   * 5. モーター遮断器 / MCCB 選定ロジック
   * インバータ一次側には一般に配線用遮断器（MCCB）を設置します。
   */
  export function selectInverterMotorBreaker(
    outputKw: number,
    calculatedAmp: number
  ): MotorBreakerSelectionResult {
    const isOver15kW = outputKw > 15.0;
    const { recommended } = calculateInverterBreakerCapacity(calculatedAmp);
  
    return {
      selectedType: 'mccb',
      recommendedAmp: recommended,
      requiresThermalRelay: false,
      isOver15kW,
      warningNote:
        'インバータ一次側遮断器です。始動電流が抑制されるため商用直結（3倍則）より容量が小さくなります。',
    };
  }
  
  /**
   * 6. インバータ用漏電遮断器 (ELCB) の選定
   * 高周波漏れ電流による誤動作を防止するため、高周波対応形（インバータ用ELCB）が必須です。
   */
  export function selectInverterELCB(
    calculatedAmp: number,
    environment: EnvironmentType,
    breakerSizes: number[]
  ): ElcbSelectionResult {
    const targetAmp = calculatedAmp * 1.4;
    const recommendedAmp =
      breakerSizes.find((s) => s >= targetAmp) || breakerSizes[breakerSizes.length - 1];
  
    const isMandatory = environment === 'wet';
    const sensitivityCurrent = isMandatory ? 15 : 30;
  
    return {
      recommendedAmp,
      sensitivityCurrent,
      operatingTime: '0.1秒以内',
      isMandatory,
      description:
        'インバータの高調波・高周波漏れ電流による誤動作を防ぐため、必ず「高周波対応形（インバータ用）」のELCBを選定してください。',
    };
  }
  
  /**
   * 7. 進相コンデンサ警告処理
   * インバータの二次側（出力側）に進相コンデンサを接続すると高周波による過熱・破壊の原因となるため接続禁止です。
   */
  export function calculateInverterPhaseCapacitor(): CapacitorSelectionResult {
    return {
      requiredKvar: 0,
      recommendedKvar: 0,
      recommendedMicroFarad: 0,
      improvedPowerFactor: 1.0,
      dischargeResistorNote:
        '【警告】インバータの二次側（電動機側）に進相コンデンサを接続することは絶対に避けてください（インバータおよびコンデンサが破損します）。',
      isTableStandard: false,
    };
  }
  
  /**
   * インバータ駆動の全計算を一括実行する統合エントリー関数
   */
  export function processInverterMotorCalc(
    params: InverterMotorCalcParams
  ): InverterMotorCalcResult {
    const {
      outputKw,
      voltage,
      powerFactor,
      efficiency,
      environment,
    } = params;
  
    // 1. 各種電流計算
    const calculatedAmp = calculateInverterMotorAmp(outputKw, voltage, powerFactor, efficiency);
    const simpleAmp = calculateInverterSimpleAmp(outputKw, voltage);
    const requiredWireAmp = calculateInverterRequiredWireAmp(calculatedAmp);
  
    // 2. 遮断器選定
    const breakerCapacity = calculateInverterBreakerCapacity(calculatedAmp);
    const breakerInfo = selectInverterMotorBreaker(outputKw, calculatedAmp);
  
    // 3. 接地・ELCB・コンデンサ判定
    const groundingInfo = calculateMotorGrounding(voltage, environment);
    const elcbInfo = selectInverterELCB(calculatedAmp, environment, BREAKER_SIZES);
    const capacitorInfo = calculateInverterPhaseCapacitor();
  
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