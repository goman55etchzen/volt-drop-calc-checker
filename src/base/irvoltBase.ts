// src/base/irvoltBase.ts

import type { PowerFrequency } from '@/types/appDefinitions';

// ==========================================
// 1. 型定義 (Types & Interfaces)
// ==========================================

/** 配線方式・相数種別 */
export type SystemPhaseType = '1P2W' | '1P3W_100V' | '1P3W_200V' | '3P3W' | '3P4W';

/** 電流・電力計算用の共通入力パラメータ */
export interface LoadCurrentParams {
  /** 有効電力 [kW] */
  powerKw: number;
  /** 定格電圧 [V] */
  voltage: number;
  /** 力率 (0.0 ～ 1.0) */
  powerFactor?: number;
  /** 効率 (0.0 ～ 1.0) */
  efficiency?: number;
  /** 配線方式 */
  phaseType?: SystemPhaseType;
}

/** 負荷合算計算結果 */
export interface TotalLoadSummary {
  /** 電動機負荷の合計電流 ∑IM [A] */
  totalMotorAmp: number;
  /** 他負荷・一般負荷の合計電流 ∑IL [A] */
  totalOtherAmp: number;
  /** 設備全体の単純合計定格電流 [A] */
  displayTotalLoadAmp: number;
  /** 内線規程に基づく幹線電線の必要許容電流基準 IW [A] */
  requiredWireAllowAmp: number;
  /** ∑IM が 50A 超過かどうかのフラグ */
  isMotorOver50A: boolean;
}

/** 電圧降下計算用の入力パラメータ */
export interface VoltageDropParams {
  /** 定格電流 [A] */
  currentA: number;
  /** 片道配線距離 [m] */
  lengthM: number;
  /** 電線断面積 [mm²] または Sq数 */
  wireAreaMm2: number;
  /** 定格電圧 [V] */
  voltage: number;
  /** 配線方式 */
  phaseType?: SystemPhaseType;
  /** 電線導体抵抗 R [Ω/km] (省略時は銅線の抵抗率から自動計算) */
  resistancePerKm?: number;
  /** 降下率計算の許容限界上限 [%] (デフォルト: 2.0%) */
  limitPercent?: number;
}

/** 電圧降下計算結果 */
export interface VoltageDropResult {
  /** 電圧降下量 e [V] */
  voltageDropV: number;
  /** 電圧降下率 ε [%] */
  dropPercentage: number;
  /** 受電端/負荷端電圧 [V] */
  terminalVoltageV: number;
  /** 許容上限クリア判定 */
  isWithinLimit: boolean;
  /** メッセージ */
  message: string;
}

/** 進相コンデンサ計算結果 */
export interface PhaseCapacitorBaseResult {
  /** 必要無効電力 Q [kVAR] */
  requiredKvar: number;
  /** 静電容量 C [μF] */
  calculatedMicroFarad: number;
}

// ==========================================
// 2. 電圧・相定数ユーティリティ
// ==========================================

/**
 * 配線方式に応じた相係数（kFactor）および定数 K を取得
 */
export function getPhaseCoefficients(phaseType: SystemPhaseType = '3P3W'): {
  voltageFactor: number;
  dropFactor: number;
} {
  switch (phaseType) {
    case '1P2W':
      return { voltageFactor: 1.0, dropFactor: 35.6 };
    case '1P3W_100V':
      return { voltageFactor: 1.0, dropFactor: 17.8 };
    case '1P3W_200V':
      return { voltageFactor: 2.0, dropFactor: 35.6 };
    case '3P3W':
      return { voltageFactor: Math.sqrt(3), dropFactor: 30.8 };
    case '3P4W':
      return { voltageFactor: Math.sqrt(3), dropFactor: 17.8 };
    default:
      return { voltageFactor: Math.sqrt(3), dropFactor: 30.8 };
  }
}

// ==========================================
// 3. 電流・電力変換コア関数
// ==========================================

/**
 * 有効電力 [kW] から定格電流 [A] を計算
 * 公式: I = (P * 1000) / (VoltageFactor * V * cosθ * η)
 */
export function calculateCurrentFromPower(params: LoadCurrentParams): number {
  const {
    powerKw,
    voltage,
    powerFactor = 0.85,
    efficiency = 0.85,
    phaseType = '3P3W',
  } = params;

  if (voltage <= 0 || powerKw <= 0) return 0;

  const { voltageFactor } = getPhaseCoefficients(phaseType);
  const pf = Math.min(Math.max(powerFactor, 0.01), 1.0);
  const eff = Math.min(Math.max(efficiency, 0.01), 1.0);

  const denominator = voltageFactor * voltage * pf * eff;
  if (denominator <= 0) return 0;

  const current = (powerKw * 1000) / denominator;
  return Number(current.toFixed(2));
}

/**
 * 電流 [A] から有効電力 [kW] を逆算
 * 公式: P = (VoltageFactor * V * I * cosθ * η) / 1000
 */
export function calculatePowerFromCurrent(
  currentA: number,
  voltage: number,
  powerFactor: number = 0.85,
  efficiency: number = 0.85,
  phaseType: SystemPhaseType = '3P3W'
): number {
  if (voltage <= 0 || currentA <= 0) return 0;

  const { voltageFactor } = getPhaseCoefficients(phaseType);
  const pf = Math.min(Math.max(powerFactor, 0.01), 1.0);
  const eff = Math.min(Math.max(efficiency, 0.01), 1.0);

  const powerKw = (voltageFactor * voltage * currentA * pf * eff) / 1000;
  return Number(powerKw.toFixed(2));
}

/**
 * 電動機出力 [kW] からの簡易目安電流 [A] 計算
 * - 400V系: kW * 2.0 (A)
 * - 200V系: kW * 4.0 (A)
 */
export function calculateSimpleEstimateCurrent(outputKw: number, voltage: number): number {
  if (outputKw <= 0) return 0;
  const multiplier = voltage >= 400 ? 2.0 : 4.0;
  return Number((outputKw * multiplier).toFixed(1));
}

// ==========================================
// 4. 負荷合算・幹線許容電流計算 (内線規程 準拠)
// ==========================================

/**
 * 複数電動機および他負荷の合算電流・幹線電線の必要許容電流 (IW) を算出
 * 内線規程基準:
 * - ∑IM <= 50A : IW >= 1.25 * ∑IM + ∑IL
 * - ∑IM > 50A  : IW >= 1.10 * ∑IM + ∑IL
 */
export function calculateCombinedTotalCurrent(
  motorAmps: number[] | number,
  otherLoadAmp: number = 0
): TotalLoadSummary {
  const totalMotorAmp = Array.isArray(motorAmps)
    ? motorAmps.reduce((sum, amp) => sum + amp, 0)
    : motorAmps;

  const displayTotalLoadAmp = Number((totalMotorAmp + otherLoadAmp).toFixed(2));
  const isMotorOver50A = totalMotorAmp > 50.0;

  const motorFactor = isMotorOver50A ? 1.1 : 1.25;
  const requiredWireAllowAmp = Number(
    (totalMotorAmp * motorFactor + otherLoadAmp).toFixed(2)
  );

  return {
    totalMotorAmp: Number(totalMotorAmp.toFixed(2)),
    totalOtherAmp: Number(otherLoadAmp.toFixed(2)),
    displayTotalLoadAmp,
    requiredWireAllowAmp,
    isMotorOver50A,
  };
}

// ==========================================
// 5. 電圧降下 (Voltage Drop) 計算
// ==========================================

/**
 * 配線長および電流による電圧降下量 (e) と降下率 (%) を計算
 * 公式: e = (K * I * L) / (1000 * A)
 */
export function calculateVoltageDrop(params: VoltageDropParams): VoltageDropResult {
  const {
    currentA,
    lengthM,
    wireAreaMm2,
    voltage,
    phaseType = '3P3W',
    limitPercent = 2.0,
  } = params;

  if (voltage <= 0 || wireAreaMm2 <= 0 || currentA <= 0 || lengthM <= 0) {
    return {
      voltageDropV: 0,
      dropPercentage: 0,
      terminalVoltageV: voltage,
      isWithinLimit: true,
      message: '入力値が不正または0のため計算をスキップしました。',
    };
  }

  const { dropFactor } = getPhaseCoefficients(phaseType);

  // 電圧降下 e [V] の計算
  const voltageDropV = Number(((dropFactor * currentA * lengthM) / (1000 * wireAreaMm2)).toFixed(2));
  const dropPercentage = Number(((voltageDropV / voltage) * 100).toFixed(2));
  const terminalVoltageV = Number((voltage - voltageDropV).toFixed(2));
  const isWithinLimit = dropPercentage <= limitPercent;

  const message = isWithinLimit
    ? `電圧降下率は ${dropPercentage}% で許容限界 (${limitPercent}%) 以内です。`
    : `【警告】電圧降下率 ${dropPercentage}% が許容限界 (${limitPercent}%) を超えています。電線サイズを太くしてください。`;

  return {
    voltageDropV,
    dropPercentage,
    terminalVoltageV,
    isWithinLimit,
    message,
  };
}

// ==========================================
// 6. 力率改善・進相コンデンサ理論計算
// ==========================================

/**
 * 有効電力 [kW] と改善前後力率から必要無効電力 Q [kVAR] を算出
 * 公式: Q = P * (tan(acos(pf1)) - tan(acos(pf2)))
 */
export function calculateRequiredCapacitorKvar(
  powerKw: number,
  currentPf: number,
  targetPf: number
): number {
  if (powerKw <= 0) return 0;

  const pf1 = Math.min(Math.max(currentPf, 0.1), 0.99);
  const pf2 = Math.min(Math.max(targetPf, pf1), 1.0);

  const tan1 = Math.tan(Math.acos(pf1));
  const tan2 = Math.tan(Math.acos(pf2));

  const requiredKvar = powerKw * (tan1 - tan2);
  return Number(requiredKvar.toFixed(2));
}

/**
 * 必要無効電力 Q [kVAR] から静電容量 C [μF] への変換
 * 公式: C = Q_var / (2 * π * f * V^2)
 */
export function convertKvarToMicroFarad(
  kvar: number,
  voltage: number,
  frequency: PowerFrequency = 50
): number {
  if (kvar <= 0 || voltage <= 0 || frequency <= 0) return 0;

  const qVar = kvar * 1000;
  const omega = 2 * Math.PI * frequency;
  const farad = qVar / (omega * Math.pow(voltage, 2));

  return Math.round(farad * 1e6);
}

/**
 * 進相コンデンサ計算の一括実行
 */
export function calculateCapacitorBase(
  powerKw: number,
  currentPf: number,
  targetPf: number,
  voltage: number,
  frequency: PowerFrequency = 50
): PhaseCapacitorBaseResult {
  const requiredKvar = calculateRequiredCapacitorKvar(powerKw, currentPf, targetPf);
  const calculatedMicroFarad = convertKvarToMicroFarad(requiredKvar, voltage, frequency);

  return {
    requiredKvar,
    calculatedMicroFarad,
  };
}