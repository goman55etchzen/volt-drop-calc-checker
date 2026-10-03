/**
 * file irvoltBase.ts
 * 電圧・配線方式・電線計算に関連する定数および計算ロジックの一元管理モジュール
 */

// ==========================================
// 型定義
// ==========================================

/** 商用電源周波数 */
export type PowerFrequency = 50 | 60;

/** 配線方式の型 */
export type SystemPhaseType = '1P2W' | '1P3W_100V' | '1P3W_200V' | '3P3W' | '3P4W';

/** 配線方式ごとの各種計算係数構造体 */
export interface PhaseCoefficients {
  /** 電流計算用の電圧係数（単相は1.0、三相は√3） */
  voltageFactor: number;
  /** 電圧降下計算用の係数 (35.6, 17.8, 30.8 など) */
  dropFactor: number;
}

/** モーター電流計算用パラメータ */
export interface MotorCurrentParams {
  /** モーター容量 [kW] */
  kw: number;
  /** 電圧 [V] */
  voltage: number;
  /** 力率 (0.0 〜 1.0 または 0 〜 100%) */
  powerFactor?: number;
  /** 効率 (0.0 〜 1.0 または 0 〜 100%) */
  efficiency?: number;
  /** 配線方式 */
  phaseType?: SystemPhaseType;
}

// ==========================================
// 係数・定数定義の一元管理
// ==========================================

/**
 * 配線方式に応じた電圧係数および電圧降下係数を取得します。
 *
 * @param phaseType 配線方式 (デフォルト: '3P3W')
 * @returns PhaseCoefficients
 */
export function getPhaseCoefficients(phaseType: SystemPhaseType = '3P3W'): PhaseCoefficients {
  switch (phaseType) {
    case '1P2W':
      return { voltageFactor: 1.0, dropFactor: 35.6 };
    case '1P3W_100V':
      return { voltageFactor: 1.0, dropFactor: 17.8 };
    case '1P3W_200V':
      // 線間電圧200Vとして直接計算するため、電圧係数は1.0とし、電圧降下係数は両外線間（35.6）を使用
      return { voltageFactor: 1.0, dropFactor: 35.6 };
    case '3P3W':
      return { voltageFactor: Math.sqrt(3), dropFactor: 30.8 };
    case '3P4W':
      return { voltageFactor: Math.sqrt(3), dropFactor: 17.8 };
    default:
      return { voltageFactor: Math.sqrt(3), dropFactor: 30.8 };
  }
}

/**
 * システムID（配線方式）から標準基準電圧 [V] を取得します。
 *
 * @param phaseType 配線方式
 * @returns 標準電圧 [V]
 */
export function getDefaultVoltage(phaseType: SystemPhaseType): number {
  switch (phaseType) {
    case '1P2W':
    case '1P3W_100V':
      return 100;
    case '1P3W_200V':
    case '3P3W':
      return 200;
    case '3P4W':
      return 200; // または地域・機器仕様に応じた標準線間電圧
    default:
      return 200;
  }
}

// ==========================================
// 計算ロジックの一元管理
// ==========================================

/**
 * 電力 (kW) と電圧 (V) 等から定格電流 [A] を計算します。
 *
 * 計算式:
 *  - 三相: I = (P * 1000) / (√3 * V * 力率 * 効率)
 *  - 単相: I = (P * 1000) / (1.0 * V * 力率 * 効率)
 *
 * @param params MotorCurrentParams
 * @returns 計算された電流値 [A] (入力値不正時は 0)
 */
export function calculateMotorCurrent(params: MotorCurrentParams): number {
  const { kw, voltage, powerFactor = 0.85, efficiency = 0.85, phaseType = '3P3W' } = params;

  if (!kw || kw <= 0 || !voltage || voltage <= 0) {
    return 0;
  }

  // パーセンテージ表記 (例: 85) で渡された場合の正規化 (0.85)
  const pf = powerFactor > 1 ? powerFactor / 100 : powerFactor;
  const eff = efficiency > 1 ? efficiency / 100 : efficiency;

  if (pf <= 0 || eff <= 0) {
    return 0;
  }

  const { voltageFactor } = getPhaseCoefficients(phaseType);

  // 電流計算: I = (kW * 1000) / (voltageFactor * V * cosθ * η)
  const current = (kw * 1000) / (voltageFactor * voltage * pf * eff);

  return Number.isNaN(current) || !Number.isFinite(current) ? 0 : current;
}

/**
 * 許容電流・電圧降下計算用（線路損失計算等）
 *
 * @param current 電流 [A]
 * @param length 距離 [m]
 * @param wireArea 電線断面積 [mm²]
 * @param phaseType 配線方式
 * @returns 電圧降下量 [V]
 */
export function calculateVoltageDrop(
  current: number,
  length: number,
  wireArea: number,
  phaseType: SystemPhaseType = '3P3W'
): number {
  if (!current || !length || !wireArea || wireArea <= 0) {
    return 0;
  }

  const { dropFactor } = getPhaseCoefficients(phaseType);
  // e = (K * L * I) / (1000 * A)
  const drop = (dropFactor * length * current) / (1000 * wireArea);

  return Number.isNaN(drop) || !Number.isFinite(drop) ? 0 : drop;
}