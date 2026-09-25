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

export type BuildingType = 'wooden' | 'reinforced'; // 木造・戸建て / 鉄筋・マンション

export interface AcSpec {
  capacityKw: number;          // 冷房定格能力(kW)
  tatamiStandard: string;      // 目安畳数表記 (例: "6畳用")
  minTatami: number;           // 最小適合畳数（木造基準）
  maxTatami: number;           // 最大適合畳数（鉄筋基準）
  voltage: 100 | 200;          // 定格電圧(V)
  phase: '1P2W' | '1P3W';      // 電源方式
  ratedCurrentA: number;       // 運転電流(A) (目安)
  maxCurrentA: number;         // 最大運転電流(A)
  breakerAmp: number;          // 推奨専用回路ブレーカー容量(A)
  breakerPoles: string;        // ブレーカー極数・素子数 ("2P1E", "2P2E")
  recommendedWireSize: string; // 推奨電線サイズ ("1.6mm", "2.0mm", "2.6mm")
  cableTypeCode: CableTypeCode; // 配線計算連携用ケーブル種別 ('vvf' に統一)
}

/** エアコン選定の入力条件パラメータ */
export interface AirconInputParams {
  areaValue: number;                   // 面積数値
  unit?: AreaUnit;                     // 面積単位 (デフォルト: 'tatami')
  roomType?: RoomType;                 // 部屋種別
  buildingType?: BuildingType;         // 構造 (デフォルト: 'wooden')
  personCount?: number;                // 在室人数（人熱負荷計算用、デフォルト: 2人）
  hasStrongSunlight?: boolean;         // 南・西向き / 大きなガラス窓あり (+10%)
  isTopFloor?: boolean;                // 高層階 / 最上階・屋根直下 (+10%)
  hasHighCeiling?: boolean;            // 吹き抜け / 高天井 (+15%)
}

export interface AirconSelectionResult {
  effectiveTatami: number;     // 補正後の実効畳数
  baseTatami: number;          // 換算後の基本畳数
  personHeatLoadKw: number;    // 人熱による加算熱負荷 (kW)
  personHeatTatami: number;    // 人熱による換算畳数加算 (畳)
  selectedSpec: AcSpec;        // 選定されたエアコンスペック
  isOverCapacity: boolean;     // 最大スペック超過フラグ
  recommendationNote: string;  // 選定アドバイスコメント
  breakdownNotes: string[];    // 計算根拠の内訳リスト
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
    recommendedWireSize: '1.6mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '1.6mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.0mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.0mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.0mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.0mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.0mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.0mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.6mm',
    cableTypeCode: 'vvf'
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
    recommendedWireSize: '2.6mm',
    cableTypeCode: 'vvf'
  }
];

// ==========================================
// 3. ユーティリティ計算関数
// ==========================================

/**
 * 電線サイズ表記から純粋なサイズ名（例: "1.6mm"）を抽出するヘルパー
 */
export function extractWireSizeName(wireSizeStr: string): string {
  if (!wireSizeStr) return '1.6mm';
  return wireSizeStr.replace(/^[A-Za-z0-9\-]+\s*/, '');
}

/**
 * 面積単位を畳数へ換算 (標準 1畳 = 1.65㎡ 基準)
 */
export function convertToTatami(value: number, unit: AreaUnit = 'tatami'): number {
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
export function getRoomMultiplier(roomType: RoomType = 'living'): number {
  switch (roomType) {
    case 'kitchen':
      return 1.30; // 火気・コンロ等の強い発熱源と換気扇の排気損失
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
 * 高精度エアコン適合スペック選定関数
 */
export function calculateAirconSelection(params: AirconInputParams): AirconSelectionResult {
  const {
    areaValue,
    unit = 'tatami',
    roomType = 'living',
    buildingType = 'wooden',
    personCount = 2,
    hasStrongSunlight = false,
    isTopFloor = false,
    hasHighCeiling = false
  } = params;

  const baseTatami = convertToTatami(areaValue, unit);
  const breakdownNotes: string[] = [];

  // 1. 部屋用途補正
  const roomMult = getRoomMultiplier(roomType);
  if (roomMult !== 1.0) {
    breakdownNotes.push(`部屋用途補正 (${roomType}): ×${roomMult.toFixed(2)}`);
  }

  // 2. 日当たり・最上階・吹き抜け環境補正
  let envMult = 1.0;
  if (hasStrongSunlight) {
    envMult += 0.10;
    breakdownNotes.push('日当たり強 / 大開口窓補正: +10%');
  }
  if (isTopFloor) {
    envMult += 0.10;
    breakdownNotes.push('最上階 / 屋根直下補正: +10%');
  }
  if (hasHighCeiling) {
    envMult += 0.15;
    breakdownNotes.push('吹き抜け / 高天井補正: +15%');
  }

  // 環境補正適用後の基礎実効畳数
  let calculatedTatami = baseTatami * roomMult * envMult;

  // 3. 人熱負荷（人熱量）の計算
  const BASE_PERSONS = 2; // 標準想定人数
  const extraPersons = Math.max(0, personCount - BASE_PERSONS);
  const personHeatLoadKw = Math.round(extraPersons * 0.1 * 100) / 100;
  const personHeatTatami = Math.round(extraPersons * 0.5 * 10) / 10;

  if (extraPersons > 0) {
    calculatedTatami += personHeatTatami;
    breakdownNotes.push(`人熱負荷 (${personCount}人 / 標準${BASE_PERSONS}人比+${extraPersons}人): +${personHeatTatami}畳分 (+${personHeatLoadKw}kW)`);
  }

  const effectiveTatami = Math.round(calculatedTatami * 10) / 10;

  // 4. 住宅構造（木造 vs 鉄筋マンション）に応じたエアコン判定基準の設定
  let selectedSpec = AC_SPECS[0];
  let isOverCapacity = false;

  for (let i = 0; i < AC_SPECS.length; i++) {
    const spec = AC_SPECS[i];

    const thresholdTatami = buildingType === 'reinforced' 
      ? spec.maxTatami 
      : spec.minTatami;

    if (effectiveTatami <= thresholdTatami) {
      selectedSpec = spec;
      break;
    }

    if (i === AC_SPECS.length - 1 && effectiveTatami > thresholdTatami) {
      selectedSpec = spec;
      isOverCapacity = true;
    }
  }

  // 5. アドバイスコメント生成
  let recommendationNote = `実効負荷 ${effectiveTatami} 畳（${buildingType === 'wooden' ? '木造' : '鉄筋マンション'}基準）に対し【${selectedSpec.tatamiStandard}（冷房能力 ${selectedSpec.capacityKw}kW）】が最適です。`;

  if (selectedSpec.voltage === 200) {
    recommendationNote += ` 電源は単相200V専用回路（2P2Eブレーカー、推奨線径 VVF ${selectedSpec.recommendedWireSize}）が必要です。`;
  } else {
    recommendationNote += ` 電源は単相100V専用回路（推奨線径 VVF ${selectedSpec.recommendedWireSize}）が必要です。`;
  }

  if (isOverCapacity) {
    recommendationNote += ` ※負荷が家庭用最大クラス（29畳用）を超えているため、複数台設置またはパッケージエアコンの導入をご検討ください。`;
  }

  return {
    effectiveTatami,
    baseTatami: Math.round(baseTatami * 10) / 10,
    personHeatLoadKw,
    personHeatTatami,
    selectedSpec,
    isOverCapacity,
    recommendationNote,
    breakdownNotes
  };
}