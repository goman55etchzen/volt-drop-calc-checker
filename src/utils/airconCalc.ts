// src/utils/airconCalc.ts
import { CableTypeCode } from '../types/appDefinitions';

// ==========================================
// 1. エアコン専用 型定義
// ==========================================

export type AreaUnit = 'tatami' | 'sqm' | 'tsubo';

export type RoomType = 
  | 'living'    // 居間・リビング
  | 'ldk'       // LDK（吹抜け・吹き抜け開放空間）
  | 'kitchen'   // 台所・キッチン（火気発熱源あり）
  | 'bedroom'   // 寝室
  | 'kids'      // 子供部屋 / 書斎
  | 'japanese'; // 和室

export interface AcSpec {
  capacityKw: number;          // 冷房定格能力(kW)
  tatamiStandard: string;      // 目安畳数表記 (例: "6畳用")
  minTatami: number;           // 最小適合畳数
  maxTatami: number;           // 最大適合畳数
  voltage: 100 | 200;          // 定格電圧(V)
  phase: '1P2W' | '1P3W';      // 電源方式
  ratedCurrentA: number;       // 運転電流(A) (目安)
  maxCurrentA: number;         // 最大運転電流(A)
  breakerAmp: number;          // 推奨専用回路ブレーカー容量(A)
  breakerPoles: string;        // ブレーカー極数・素子数 (例: "2P1E", "2P2E")
  recommendedWireSize: string; // 推奨電線サイズ (例: "VVF 1.6mm", "VVF 2.0mm")
  cableTypeCode: CableTypeCode; // 配線計算連携用ケーブル種別
}

export interface AirconSelectionResult {
  effectiveTatami: number;     // 補正後の実効畳数
  baseTatami: number;          // 変換後の入力畳数
  selectedSpec: AcSpec;        // 選定されたエアコンスペック
  isOverCapacity: boolean;     // 最大スペック超過フラグ
  recommendationNote: string;  // 選定アドバイスコメント
}

// ==========================================
// 2. エアコン能力マスタデータ
// ==========================================

export const AC_SPECS: AcSpec[] = [
  {
    capacityKw: 2.2,
    tatamiStandard: '6畳用',
    minTatami: 6,
    maxTatami: 9,
    voltage: 100,
    phase: '1P2W',
    ratedCurrentA: 5.8,
    maxCurrentA: 15.0,
    breakerAmp: 15,
    breakerPoles: '2P1E',
    recommendedWireSize: 'VVF 1.6mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 2.5,
    tatamiStandard: '8畳用',
    minTatami: 7,
    maxTatami: 10,
    voltage: 100,
    phase: '1P2W',
    ratedCurrentA: 6.8,
    maxCurrentA: 15.0,
    breakerAmp: 15,
    breakerPoles: '2P1E',
    recommendedWireSize: 'VVF 1.6mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 2.8,
    tatamiStandard: '10畳用',
    minTatami: 8,
    maxTatami: 12,
    voltage: 100,
    phase: '1P2W',
    ratedCurrentA: 8.2,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: '2P1E',
    recommendedWireSize: 'VVF 2.0mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 3.6,
    tatamiStandard: '12畳用',
    minTatami: 10,
    maxTatami: 15,
    voltage: 100,
    phase: '1P2W',
    ratedCurrentA: 10.5,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: '2P1E',
    recommendedWireSize: 'VVF 2.0mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 4.0,
    tatamiStandard: '14畳用',
    minTatami: 11,
    maxTatami: 17,
    voltage: 200,
    phase: '1P3W',
    ratedCurrentA: 5.8,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: '2P2E',
    recommendedWireSize: 'VVF 2.0mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 5.6,
    tatamiStandard: '18畳用',
    minTatami: 15,
    maxTatami: 23,
    voltage: 200,
    phase: '1P3W',
    ratedCurrentA: 8.5,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: '2P2E',
    recommendedWireSize: 'VVF 2.0mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 6.3,
    tatamiStandard: '20畳用',
    minTatami: 17,
    maxTatami: 26,
    voltage: 200,
    phase: '1P3W',
    ratedCurrentA: 9.8,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: '2P2E',
    recommendedWireSize: 'VVF 2.0mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 7.1,
    tatamiStandard: '23畳用',
    minTatami: 20,
    maxTatami: 30,
    voltage: 200,
    phase: '1P3W',
    ratedCurrentA: 11.5,
    maxCurrentA: 20.0,
    breakerAmp: 20,
    breakerPoles: '2P2E',
    recommendedWireSize: 'VVF 2.0mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 8.0,
    tatamiStandard: '26畳用',
    minTatami: 22,
    maxTatami: 33,
    voltage: 200,
    phase: '1P3W',
    ratedCurrentA: 13.0,
    maxCurrentA: 30.0,
    breakerAmp: 30,
    breakerPoles: '2P2E',
    recommendedWireSize: 'VVF 2.6mm',
    cableTypeCode: 'vv'
  },
  {
    capacityKw: 9.0,
    tatamiStandard: '29畳用',
    minTatami: 25,
    maxTatami: 38,
    voltage: 200,
    phase: '1P3W',
    ratedCurrentA: 15.0,
    maxCurrentA: 30.0,
    breakerAmp: 30,
    breakerPoles: '2P2E',
    recommendedWireSize: 'VVF 2.6mm',
    cableTypeCode: 'vv'
  }
];

// ==========================================
// 3. ユーティリティ計算関数
// ==========================================

/**
 * 面積単位を畳数へ換算 (中京間/標準 1畳 = 1.65㎡ 基準)
 */
export function convertToTatami(value: number, unit: AreaUnit): number {
  if (value <= 0) return 0;
  switch (unit) {
    case 'sqm':
      return value / 1.65;
    case 'tsubo':
      return value * 2.0;
    case 'tatami':
    default:
      return value;
  }
}

/**
 * 部屋の種類に応じた熱負荷補正係数を算出
 */
export function getRoomMultiplier(roomType: RoomType): number {
  switch (roomType) {
    case 'kitchen':
      return 1.30; // 火気・調理器具などの強い発熱負荷
    case 'ldk':
      return 1.20; // 吹き抜け・開放空間・人が集まる空間
    case 'living':
      return 1.10; // 一般的な居間
    case 'japanese':
      return 1.05; // 日当たり等に応じた標準和室
    case 'bedroom':
    case 'kids':
    default:
      return 1.00; // 主に夜間や単一使用の洋室
  }
}

/**
 * エアコン適合スペック選定関数
 */
export function calculateAirconSelection(
  areaValue: number,
  unit: AreaUnit = 'tatami',
  roomType: RoomType = 'living'
): AirconSelectionResult {
  const baseTatami = convertToTatami(areaValue, unit);
  if (baseTatami <= 0) {
    return {
      effectiveTatami: 0,
      baseTatami: 0,
      selectedSpec: AC_SPECS[0],
      isOverCapacity: false,
      recommendationNote: '広さを入力してください。'
    };
  }

  const multiplier = getRoomMultiplier(roomType);
  const effectiveTatami = Math.round(baseTatami * multiplier * 10) / 10;

  // 実効畳数を安全にカバーできるスペック（木造基準 minTatami 基準）の最小スペックを選定
  let selectedSpec = AC_SPECS[AC_SPECS.length - 1];
  let isOverCapacity = false;

  for (let i = 0; i < AC_SPECS.length; i++) {
    const spec = AC_SPECS[i];
    if (effectiveTatami <= spec.minTatami) {
      selectedSpec = spec;
      break;
    }
  }

  // 最大スペックの対応範囲を超えた場合のハンドリング
  const maxSpec = AC_SPECS[AC_SPECS.length - 1];
  if (effectiveTatami > maxSpec.minTatami) {
    selectedSpec = maxSpec;
    if (effectiveTatami > maxSpec.maxTatami) {
      isOverCapacity = true;
    }
  }

  // アドバイスコメントの生成
  let recommendationNote = `実効畳数 ${effectiveTatami} 畳に対して【${selectedSpec.tatamiStandard}（${selectedSpec.capacityKw}kW）】が最適です。`;

  if (selectedSpec.voltage === 200) {
    recommendationNote += ` 電源は単相200V専用回路（2P2Eブレーカー）が必要です。`;
  } else {
    recommendationNote += ` 電源は単相100V専用回路が必要です。`;
  }

  if (isOverCapacity) {
    recommendationNote += ` ※広さが家庭用最大クラス（29畳用）を超えているため、複数台設置または業務用エアコンの導入をご検討ください。`;
  }

  return {
    effectiveTatami,
    baseTatami: Math.round(baseTatami * 10) / 10,
    selectedSpec,
    isOverCapacity,
    recommendationNote
  };
}