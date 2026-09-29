// src/base/breakerBase.ts

// ==========================================
// 1. 基本型定義・定数マスタ
// ==========================================

export type MotorBreakerType = "auto" | "motor_breaker" | "mccb";
export type EnvironmentType = "normal" | "enclosure" | "wet";

/** 標準単相/配線用遮断器容量 (A) */
export const BREAKER_SIZES = [
  15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300,
];

/** 三相配線用・モーター遮断器標準容量 (A) */
export const THREE_PHASE_BREAKER_SIZES = [
  20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300, 400,
];

/** モーター遮断器選定基本結果 */
export interface MotorBreakerSelectionResult {
  selectedType: "motor_breaker" | "mccb";
  recommendedAmp: number;
  requiresThermalRelay: boolean;
  isOver15kW: boolean;
  warningNote?: string;
}

/** 漏電遮断器（ELCB）選定基本結果 */
export interface ElcbSelectionResult {
  recommendedAmp: number;
  sensitivityCurrent: number;
  operatingTime: string;
  maxGroundResistance: number;
  isMandatory: boolean;
  description: string;
}

/** 遮断器選定パラメータ */
export interface SelectBreakerParams {
  outputKw: number;
  singleAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  wireAllowAmp?: number;
  breakerTypeMode: MotorBreakerType;
  driveMode: "direct" | "inverter";
  environment?: EnvironmentType;
}

export type BreakerSelectParams = SelectBreakerParams;

// ==========================================
// 2. 他候補・拡張型定義
// ==========================================

/** ブレーカー容量候補 */
export interface BreakerCandidate {
  amp: number;
  label: '推奨（標準）' | '1サイズ上（余裕・将来拡張用）' | '1サイズ下（最小制限値）' | '幹線限界上限';
  isRecommended: boolean;
  frameAf?: number;
  description: string;
}

/** ELCB感度電流・動作特性候補 */
export interface ElcbCandidate {
  sensitivityCurrent: number; // mA
  operatingTime: string;
  label: '標準推奨' | '高感度形（人身保護・水回り）' | '中感度形（インバータ誤動作防止）' | '時延形（保護協調用）';
  isRecommended: boolean;
  maxGroundResistance: number; // 許容接地抵抗 (Ω)
  description: string;
}

/** AF（アンペアフレーム）/ AT（アンパートリップ）規格候補 */
export interface BreakerFrameSpec {
  af: number;
  at: number;
  displayName: string;
  description: string;
}

/** 他の候補を含むモーター遮断器選定結果 */
export interface ExtendedMotorBreakerResult extends MotorBreakerSelectionResult {
  ampCandidates: BreakerCandidate[];
  frameCandidates: BreakerFrameSpec[];
}

/** 他の候補を含む漏電遮断器選定結果 */
export interface ExtendedElcbResult extends ElcbSelectionResult {
  ampCandidates: BreakerCandidate[];
  sensitivityCandidates: ElcbCandidate[];
  frameCandidates: BreakerFrameSpec[];
}

/** 一般負荷（電灯・コンセント・ヒーター等）選定パラメータ */
export interface GeneralBreakerParams {
  loadAmp: number;
  wireAllowAmp?: number;
  isContinuous?: boolean; // 3時間以上の連続負荷 (1.25倍考慮)
}

/** 一般負荷用遮断器選定結果 */
export interface GeneralBreakerResult {
  recommendedAmp: number;
  ampCandidates: BreakerCandidate[];
  frameCandidates: BreakerFrameSpec[];
  description: string;
}

/** ブレーカー・ELB・MB 総合一括選定結果 */
export interface BreakerBaseComprehensiveResult {
  motorBreaker: ExtendedMotorBreakerResult;
  elcb: ExtendedElcbResult;
  generalBreaker?: GeneralBreakerResult;
  summaryNotes: string[];
}

// ==========================================
// 3. AF/AT・容量・感度候補算出ユーティリティ
// ==========================================

/**
 * 定格電流 (A) に対応する標準的な AF / AT 規格候補を取得
 */
export function getBreakerFrameCandidates(amp: number): BreakerFrameSpec[] {
  const frames: BreakerFrameSpec[] = [];

  if (amp <= 30) {
    frames.push({
      af: 30,
      at: amp,
      displayName: `30AF / ${amp}AT`,
      description: '分電盤・標準機器用コンパクトフレーム'
    });
    frames.push({
      af: 50,
      at: amp,
      displayName: `50AF / ${amp}AT`,
      description: '高遮断容量・余裕フレーム'
    });
  } else if (amp <= 50) {
    frames.push({
      af: 50,
      at: amp,
      displayName: `50AF / ${amp}AT`,
      description: '標準動力盤用フレーム'
    });
    frames.push({
      af: 100,
      at: amp,
      displayName: `100AF / ${amp}AT`,
      description: '高能率・上位互換フレーム'
    });
  } else if (amp <= 100) {
    frames.push({
      af: 100,
      at: amp,
      displayName: `100AF / ${amp}AT`,
      description: '中規模幹線・動力用標準フレーム'
    });
    frames.push({
      af: 225,
      at: amp,
      displayName: `225AF / ${amp}AT`,
      description: '大容量遮断性能確保用'
    });
  } else if (amp <= 225) {
    frames.push({
      af: 225,
      at: amp,
      displayName: `225AF / ${amp}AT`,
      description: '主幹・主要幹線用標準フレーム'
    });
  } else {
    frames.push({
      af: 400,
      at: amp,
      displayName: `400AF / ${amp}AT`,
      description: '特大容量幹線・受変電設備用'
    });
  }

  return frames;
}

/**
 * 推奨定格容量周辺の比較候補（1サイズ上・1サイズ下等）を算出
 */
export function getBreakerCandidates(
  recommendedAmp: number,
  limitByWire: number = Infinity,
  isThreePhase: boolean = true
): BreakerCandidate[] {
  const sizes = isThreePhase ? THREE_PHASE_BREAKER_SIZES : BREAKER_SIZES;
  const candidates: BreakerCandidate[] = [];
  const recIndex = sizes.indexOf(recommendedAmp);

  if (recIndex !== -1) {
    // 推奨値
    candidates.push({
      amp: recommendedAmp,
      label: '推奨（標準）',
      isRecommended: true,
      description: '内線規程に適合した標準的な選定値です。'
    });

    // 1サイズ上 (幹線許容限界を超えない場合)
    if (recIndex < sizes.length - 1) {
      const upperAmp = sizes[recIndex + 1];
      if (upperAmp <= limitByWire) {
        candidates.push({
          amp: upperAmp,
          label: '1サイズ上（余裕・将来拡張用）',
          isRecommended: false,
          description: '将来の増設や始動電流サージに対するマージンを設けた選定です。'
        });
      }
    }

    // 1サイズ下
    if (recIndex > 0) {
      const lowerAmp = sizes[recIndex - 1];
      candidates.push({
        amp: lowerAmp,
        label: '1サイズ下（最小制限値）',
        isRecommended: false,
        description: '最小限の遮断容量です。過負荷保護の感度は上がりますが誤遮断に注意してください。'
      });
    }
  }

  return candidates;
}

/**
 * 漏電遮断器（ELCB）の感度電流候補を算出
 */
export function getElcbSensitivityCandidates(
  recommendedAmp: number,
  environment: EnvironmentType = 'normal'
): ElcbCandidate[] {
  const isWet = environment === 'wet';

  return [
    {
      sensitivityCurrent: 15,
      operatingTime: '0.1秒以内',
      label: isWet ? '標準推奨' : '高感度形（人身保護・水回り）',
      isRecommended: isWet,
      maxGroundResistance: 1000,
      description: '水気・湿気のある場所や感電危険度の高い場所で必須とされる高感度形。'
    },
    {
      sensitivityCurrent: 30,
      operatingTime: '0.1秒以内',
      label: !isWet && recommendedAmp <= 50 ? '標準推奨' : '標準形（一般屋内）',
      isRecommended: !isWet && recommendedAmp <= 50,
      maxGroundResistance: 500,
      description: '一般屋内の分岐回路・動力回路で最も広く普及している標準感度。'
    },
    {
      sensitivityCurrent: 100,
      operatingTime: '0.1秒以内',
      label: !isWet && recommendedAmp > 50 ? '標準推奨' : '中感度形（インバータ誤動作防止）',
      isRecommended: !isWet && recommendedAmp > 50,
      maxGroundResistance: 150,
      description: '長尺配線やインバータ等の高周波漏れ電流による不要動作を防止する中感度形。'
    }
  ];
}

// ==========================================
// 4. モーター・ELCB・一般負荷選定コアロジック
// ==========================================

/**
 * モーター保護遮断器（MCCB / MB）拡張選定
 */
export function selectExtendedMotorBreaker(params: BreakerSelectParams): ExtendedMotorBreakerResult {
  const { outputKw, singleAmp, motorCount, otherLoadAmp, wireAllowAmp, breakerTypeMode, driveMode } = params;

  const totalMotorAmp = singleAmp * motorCount;
  const isOver15kW = outputKw > 15.0;

  let selectedType: 'motor_breaker' | 'mccb' = 'motor_breaker';
  if (driveMode === 'inverter' || isOver15kW || otherLoadAmp > 0 || breakerTypeMode === 'mccb') {
    selectedType = 'mccb';
  } else if (breakerTypeMode === 'auto') {
    selectedType = 'motor_breaker';
  } else {
    selectedType = breakerTypeMode;
  }

  let recommendedAmp = 30;
  const limitByWire = (wireAllowAmp && wireAllowAmp > 0) ? 2.5 * wireAllowAmp : Infinity;

  if (selectedType === 'motor_breaker') {
    recommendedAmp = THREE_PHASE_BREAKER_SIZES.find((s) => s >= singleAmp) || 20;
    if (recommendedAmp < 20) recommendedAmp = 20;
  } else {
    const motorFactor = totalMotorAmp <= 50 ? 3.0 : 2.75;
    const limitByLoad = totalMotorAmp * motorFactor + otherLoadAmp;

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

  const requiresThermalRelay = selectedType === 'mccb' || driveMode === 'inverter' || isOver15kW;

  const notes: string[] = [];
  if (isOver15kW) notes.push('15kWを超える電動機のため配線用遮断器(MCCB)+サーマルリレーの組み合わせを推奨します。');
  if (driveMode === 'inverter') notes.push('インバータ駆動回路のため高周波対応の漏電遮断器・過電流保護機器を選定してください。');
  if (otherLoadAmp > 0 && selectedType === 'motor_breaker') notes.push('他負荷が混在しているためMCCBによる一括保護を推奨します。');

  return {
    selectedType,
    recommendedAmp,
    requiresThermalRelay,
    isOver15kW,
    warningNote: notes.join(' '),
    ampCandidates: getBreakerCandidates(recommendedAmp, limitByWire, true),
    frameCandidates: getBreakerFrameCandidates(recommendedAmp)
  };
}

/**
 * 漏電遮断器（ELCB）拡張選定
 */
export function selectExtendedElcb(params: {
  motorAmp: number;
  otherLoadAmp: number;
  wireAllowAmp: number;
  environment?: EnvironmentType;
}): ExtendedElcbResult {
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
    description,
    ampCandidates: getBreakerCandidates(recommendedAmp, limitByWire, true),
    sensitivityCandidates: getElcbSensitivityCandidates(recommendedAmp, environment),
    frameCandidates: getBreakerFrameCandidates(recommendedAmp)
  };
}

/**
 * 一般負荷用配線用遮断器選定
 */
export function selectGeneralBreaker(params: GeneralBreakerParams): GeneralBreakerResult {
  const { loadAmp, wireAllowAmp = Infinity, isContinuous = false } = params;
  const targetLoad = isContinuous ? loadAmp * 1.25 : loadAmp;

  let recommendedAmp = BREAKER_SIZES.find((s) => s >= targetLoad) || BREAKER_SIZES[BREAKER_SIZES.length - 1];

  if (recommendedAmp > wireAllowAmp) {
    const valid = BREAKER_SIZES.filter((s) => s <= wireAllowAmp);
    recommendedAmp = valid.length > 0 ? valid[valid.length - 1] : 15;
  }

  return {
    recommendedAmp,
    ampCandidates: getBreakerCandidates(recommendedAmp, wireAllowAmp, false),
    frameCandidates: getBreakerFrameCandidates(recommendedAmp),
    description: `負荷電流 ${loadAmp.toFixed(1)}A ${isContinuous ? '(連続負荷1.25倍考慮: ' + targetLoad.toFixed(1) + 'A)' : ''} に基づき、${recommendedAmp}A の配線用遮断器を選定。`
  };
}

/**
 * 総合一括選定関数
 */
export function selectComprehensiveBreakers(params: BreakerSelectParams): BreakerBaseComprehensiveResult {
  const motorBreaker = selectExtendedMotorBreaker(params);
  const elcb = selectExtendedElcb({
    motorAmp: params.singleAmp * params.motorCount,
    otherLoadAmp: params.otherLoadAmp,
    wireAllowAmp: params.wireAllowAmp || 0,
    environment: params.environment
  });

  const summaryNotes: string[] = [];
  if (motorBreaker.warningNote) summaryNotes.push(motorBreaker.warningNote);
  if (elcb.isMandatory) summaryNotes.push('感電防止のため高感度形ELCBの設置が法令・規定上必須です。');

  return {
    motorBreaker,
    elcb,
    summaryNotes
  };
}