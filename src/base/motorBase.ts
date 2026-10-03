// src/base/motorBase.ts

import type {
  EnvironmentType,
  MotorBreakerType,
  MotorBreakerSelectionResult,
  ElcbSelectionResult,
  GroundingResult,
} from "@/base/breakerBase";
import { THREE_PHASE_BREAKER_SIZES } from "@/base/breakerBase";
import type { PowerFrequency } from "@/base/irvoltBase";
import type { CapacitorSelectionResult } from "@/base/capacitorBase";

  /**
   * 電動機標準仕様エントリー
   */
  export interface MotorSpecEntry {
    kw: number;
    amp200V: number;
    amp400V: number;
    defaultPowerFactor: number;
    defaultEfficiency: number;
  }
  
  /**
   * 電動機計算 基本入力パラメータ
   */
  export interface MotorBaseInputParams {
    outputKw: number;
    voltage: number;
    frequency: PowerFrequency;
    powerFactor?: number;
    targetPowerFactor?: number;
    efficiency?: number;
    environment?: EnvironmentType;
    driveMode?: 'direct' | 'inverter';
    breakerTypeMode?: MotorBreakerType;
    motorCount?: number;
    otherLoadAmp?: number;
  }
  
  /**
   * 電動機計算 統合出力結果
   */
  export interface MotorBaseCalcResult {
    calculatedAmp: number;
    simpleAmp: number;
    totalLoadAmp: number;
    requiredWireAmp: number;
    breakerInfo: MotorBreakerSelectionResult;
    elcbInfo: ElcbSelectionResult;
    groundingInfo: GroundingResult;
    capacitorInfo: CapacitorSelectionResult;
  }
  
  /**
   * 三相200V/400V級 標準電動機仕様データベース（JIS C 4212 / 汎用誘導電動機基準）
   */
  export const STANDARD_MOTOR_SPECS: MotorSpecEntry[] = [
    { kw: 0.2,  amp200V: 1.8,  amp400V: 0.9,  defaultPowerFactor: 0.80, defaultEfficiency: 0.75 },
    { kw: 0.4,  amp200V: 3.2,  amp400V: 1.6,  defaultPowerFactor: 0.80, defaultEfficiency: 0.78 },
    { kw: 0.75, amp200V: 4.8,  amp400V: 2.4,  defaultPowerFactor: 0.80, defaultEfficiency: 0.81 },
    { kw: 1.5,  amp200V: 8.0,  amp400V: 4.0,  defaultPowerFactor: 0.80, defaultEfficiency: 0.83 },
    { kw: 2.2,  amp200V: 11.1, amp400V: 5.6,  defaultPowerFactor: 0.80, defaultEfficiency: 0.85 },
    { kw: 3.7,  amp200V: 17.4, amp400V: 8.7,  defaultPowerFactor: 0.85, defaultEfficiency: 0.86 },
    { kw: 5.5,  amp200V: 26.0, amp400V: 13.0, defaultPowerFactor: 0.85, defaultEfficiency: 0.87 },
    { kw: 7.5,  amp200V: 34.0, amp400V: 17.0, defaultPowerFactor: 0.85, defaultEfficiency: 0.88 },
    { kw: 11.0, amp200V: 48.0, amp400V: 24.0, defaultPowerFactor: 0.88, defaultEfficiency: 0.89 },
    { kw: 15.0, amp200V: 65.0, amp400V: 32.5, defaultPowerFactor: 0.88, defaultEfficiency: 0.90 },
    { kw: 18.5, amp200V: 79.0, amp400V: 39.5, defaultPowerFactor: 0.88, defaultEfficiency: 0.91 },
    { kw: 22.0, amp200V: 93.0, amp400V: 46.5, defaultPowerFactor: 0.88, defaultEfficiency: 0.91 },
    { kw: 30.0, amp200V: 124.0, amp400V: 62.0, defaultPowerFactor: 0.89, defaultEfficiency: 0.92 },
    { kw: 37.0, amp200V: 152.0, amp400V: 76.0, defaultPowerFactor: 0.89, defaultEfficiency: 0.92 },
    { kw: 45.0, amp200V: 182.0, amp400V: 91.0, defaultPowerFactor: 0.89, defaultEfficiency: 0.93 },
    { kw: 55.0, amp200V: 220.0, amp400V: 110.0, defaultPowerFactor: 0.89, defaultEfficiency: 0.93 },
  ];

  /**
   * 旧アプリAPI互換用のモーター仕様型。定義元は motorBase.ts に統一。
   */
  export interface MotorSpec {
    kw: number;
    amp: number;
    defaultCosTheta: number;
  }

  /**
   * 旧アプリAPI互換用。STANDARD_MOTOR_SPECS の200V値から生成するため、
   * モーター仕様データの実体は STANDARD_MOTOR_SPECS に一本化。
   */
  export const MOTOR_SPECS: MotorSpec[] = STANDARD_MOTOR_SPECS
    .filter((spec) => spec.amp200V > 0)
    .map((spec) => ({
      kw: spec.kw,
      amp: spec.amp200V,
      defaultCosTheta: spec.defaultPowerFactor,
    }));

  /**
   * 電動機計算コア・ベースクラス
   */
  export class MotorBaseCalculator {
    /**
     * 単機定格電流の厳密計算 (三相 / 単相)
     * 公式: In = (P * 1000) / (√3 * V * cosθ * η)
     */
    public static calculateRatedAmp(
      outputKw: number,
      voltage: number,
      powerFactor: number = 0.85,
      efficiency: number = 0.85,
      isSinglePhase: boolean = false
    ): number {
      if (outputKw <= 0 || voltage <= 0) return 0;
      const pWatt = outputKw * 1000;
      const rootFactor = isSinglePhase ? 1.0 : Math.sqrt(3);
      const denominator = rootFactor * voltage * powerFactor * efficiency;
      if (denominator <= 0) return 0;
      
      return Number((pWatt / denominator).toFixed(2));
    }
  
    /**
     * 簡易目安電流の計算 (200V: 約4A/kW, 400V: 約2A/kW)
     */
    public static calculateSimpleAmp(outputKw: number, voltage: number): number {
      if (outputKw <= 0) return 0;
      if (voltage >= 380) {
        return Number((outputKw * 2.0).toFixed(1));
      }
      return Number((outputKw * 4.0).toFixed(1));
    }
  
    /**
     * 幹線電線の最小許容電流計算（内線規程：電動機多台数・一般負荷合算対応）
     * - ΣIm <= 50A : Iw = 1.25 * ΣIm + ΣIr
     * - ΣIm > 50A  : Iw = 1.10 * ΣIm + ΣIr
     */
    public static calculateRequiredWireAmp(
      singleAmp: number,
      motorCount: number = 1,
      otherLoadAmp: number = 0
    ): number {
      const sumIm = singleAmp * Math.max(1, motorCount);
      const sumIr = Math.max(0, otherLoadAmp);
  
      if (sumIm <= 50) {
        return Number((sumIm * 1.25 + sumIr).toFixed(2));
      } else {
        return Number((sumIm * 1.10 + sumIr).toFixed(2));
      }
    }
  
    /**
     * 合算総負荷電流計算
     */
    public static calculateTotalLoadAmp(
      singleAmp: number,
      motorCount: number = 1,
      otherLoadAmp: number = 0
    ): number {
      return Number((singleAmp * Math.max(1, motorCount) + Math.max(0, otherLoadAmp)).toFixed(2));
    }
  
    /**
     * 配線用遮断器（MCCB）またはモーターブレーカーの定格容量判定
     */
    public static selectBreaker(
      singleAmp: number,
      motorCount: number = 1,
      otherLoadAmp: number = 0,
      driveMode: 'direct' | 'inverter' = 'direct',
      breakerTypeMode: MotorBreakerType = 'auto',
      outputKw: number = 0
    ): MotorBreakerSelectionResult {
      const sumIm = singleAmp * Math.max(1, motorCount);
      const sumIr = Math.max(0, otherLoadAmp);
      const isOver15kW = outputKw > 15.0;
  
      // インバータ駆動時（始動電流抑制のため 1.4倍選定）
      if (driveMode === 'inverter') {
        const targetAmp = sumIm * 1.4 + sumIr;
        const recommended =
          THREE_PHASE_BREAKER_SIZES.find((s) => s >= targetAmp) ||
          THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];
  
        return {
          selectedType: 'mccb',
          recommendedAmp: recommended,
          requiresThermalRelay: false,
          isOver15kW,
          warningNote: 'インバータ一次側遮断器です。高調波・インバータ容量を考慮した1.4倍基準選定を行っています。',
        };
      }
  
      // 商用直結駆動時（3倍則選定： 3 * ΣIm + ΣIr）
      const targetAmp = sumIm * 3.0 + sumIr;
      const recommended =
        THREE_PHASE_BREAKER_SIZES.find((s) => s >= targetAmp) ||
        THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];
  
      const selectedType = breakerTypeMode === 'motor_breaker' ? 'motor_breaker' : 'mccb';
  
      return {
        selectedType,
        recommendedAmp: recommended,
        requiresThermalRelay: selectedType === 'mccb',
        isOver15kW,
        warningNote: isOver15kW
          ? '15kWを超える電動機を商用直結で始動する場合は、スターデルタ始動等の始動電流低減対策が必要です。'
          : undefined,
      };
    }
  
    /**
     * 漏電遮断器 (ELCB) の選定
     */
    public static selectElcb(
      breakerAmp: number,
      environment: EnvironmentType = 'normal',
      driveMode: 'direct' | 'inverter' = 'direct'
    ): ElcbSelectionResult {
      const isWet = environment === 'wet';
      const sensitivityCurrent = isWet ? 15 : 30; // 湿潤場所は感度電流15mA以下
  
      let description = isWet
        ? '水気のある湿潤場所のため、高感度高速形（15mA以下）漏電遮断器の設置が義務付けられています。'
        : '通常の乾燥場所向けの漏電遮断器選定です。';
  
      if (driveMode === 'inverter') {
        description += ' ※インバータの高調波・漏れ電流による誤動作を防ぐため、必ず「インバータ対応形」を選定してください。';
      }
  
      return {
        recommendedAmp: breakerAmp,
        sensitivityCurrent,
        operatingTime: '0.1秒以内',
        maxGroundResistance: isWet ? 500 : 500,
        isMandatory: isWet || driveMode === 'inverter',
        description,
      };
    }
  
    /**
     * 接地工事種別・接地抵抗値の判定 (内線規程・電気設備技術基準)
     */
    public static determineGrounding(
      voltage: number,
      environment: EnvironmentType = 'normal'
    ): GroundingResult {
      const isHighVoltage = voltage > 300;
      const groundType = isHighVoltage ? 'C種接地工事' : 'D種接地工事';
      const baseResistance = isHighVoltage ? 10 : 100;
      const allowableResistanceWithElcb = 500; // ELCB設置時の規制緩和上限値
  
      const notes: string[] = [
        `使用電圧${voltage}Vのため、${groundType}（接地抵抗 ${baseResistance}Ω 以下）を施工してください。`,
      ];
  
      if (environment === 'wet') {
        notes.push('水気のある場所では感電リスクが高いため、漏電遮断器との併用および確実にアース接続を行ってください。');
      }
  
      return {
        groundType,
        groundResistance: baseResistance,
        allowableResistanceWithElcb,
        insulationResistance: voltage >= 300 ? 0.4 : 0.2, // MΩ以上
        groundWireDiameter: voltage >= 300 ? '1.6mm以上' : '1.6mm以上',
        requiresELCB: environment === 'wet',
        notes,
      };
    }
  
    /**
     * 進相コンデンサ算定（力率改善に必要な容量 kvar / μF）
     */
    public static calculateCapacitor(
      outputKw: number,
      voltage: number,
      frequency: PowerFrequency,
      powerFactor: number = 0.85,
      targetPowerFactor: number = 0.95,
      driveMode: 'direct' | 'inverter' = 'direct'
    ): CapacitorSelectionResult {
      if (driveMode === 'inverter') {
        return {
          requiredKvar: 0,
          recommendedKvar: 0,
          recommendedMicroFarad: 0,
          improvedPowerFactor: 1.0,
          dischargeResistorNote:
            '【警告】インバータの二次側（電動機側）に進相コンデンサを接続することは厳禁です（高周波により機器が破損します）。',
          isTableStandard: false,
        };
      }
  
      if (outputKw <= 0 || voltage <= 0) {
        return {
          requiredKvar: 0,
          recommendedKvar: 0,
          recommendedMicroFarad: 0,
          improvedPowerFactor: targetPowerFactor,
          dischargeResistorNote: '',
          isTableStandard: false,
        };
      }
  
      // 必要無効電力 Qc = P * (tanθ1 - tanθ2)
      const theta1 = Math.acos(Math.min(1, powerFactor));
      const theta2 = Math.acos(Math.min(1, targetPowerFactor));
      const tan1 = Math.tan(theta1);
      const tan2 = Math.tan(theta2);
  
      const requiredKvar = Math.max(0, outputKw * (tan1 - tan2));
  
      // 静電容量 C [μF] = (Qc * 10^9) / (2 * π * f * V^2)
      const omega = 2 * Math.PI * frequency;
      const microFarad = (requiredKvar * 1000 * 1e6) / (omega * Math.pow(voltage, 2));
  
      return {
        requiredKvar: Number(requiredKvar.toFixed(2)),
        recommendedKvar: Number((Math.ceil(requiredKvar * 10) / 10).toFixed(1)),
        recommendedMicroFarad: Math.round(microFarad),
        improvedPowerFactor: targetPowerFactor,
        dischargeResistorNote:
          '残電磁電荷による感電防止のため、放電抵抗付き（または放電コイル付き）進相コンデンサをご使用ください。',
        isTableStandard: true,
      };
    }
  
    /**
     * 全計算の一括実行（エントリー関数）
     */
    public static execute(params: MotorBaseInputParams): MotorBaseCalcResult {
      const {
        outputKw,
        voltage,
        frequency,
        powerFactor = 0.85,
        targetPowerFactor = 0.95,
        efficiency = 0.85,
        environment = 'normal',
        driveMode = 'direct',
        breakerTypeMode = 'auto',
        motorCount = 1,
        otherLoadAmp = 0,
      } = params;
  
      const calculatedAmp = this.calculateRatedAmp(outputKw, voltage, powerFactor, efficiency);
      const simpleAmp = this.calculateSimpleAmp(outputKw, voltage);
      const totalLoadAmp = this.calculateTotalLoadAmp(calculatedAmp, motorCount, otherLoadAmp);
      const requiredWireAmp = this.calculateRequiredWireAmp(calculatedAmp, motorCount, otherLoadAmp);
  
      const breakerInfo = this.selectBreaker(
        calculatedAmp,
        motorCount,
        otherLoadAmp,
        driveMode,
        breakerTypeMode,
        outputKw
      );
  
      const elcbInfo = this.selectElcb(breakerInfo.recommendedAmp, environment, driveMode);
      const groundingInfo = this.determineGrounding(voltage, environment);
      const capacitorInfo = this.calculateCapacitor(
        outputKw,
        voltage,
        frequency,
        powerFactor,
        targetPowerFactor,
        driveMode
      );
  
      return {
        calculatedAmp,
        simpleAmp,
        totalLoadAmp,
        requiredWireAmp,
        breakerInfo,
        elcbInfo,
        groundingInfo,
        capacitorInfo,
      };
    }
  }