import { ref, computed } from "vue";

import {
  type AreaUnit,
  type RoomType,
  type BuildingType,
  type AirconInputParams,
  calculateAirconSelection,
  AC_SPECS,
} from "@/utils/airconCalc";

import type { CableTypeCode } from "@/types/appDefinitions";

// ==========================================
// 配線計算連携Payload
// ==========================================

export interface AirconCableSelectionPayload {
  /** ケーブル種別 */
  cableType: CableTypeCode;

  /** 推奨電線サイズ */
  wireSize: string;

  /** 電源電圧 */
  voltage: number;

  /**
   * 配線計算に使用する電流値
   *
   * ★必ず maxCurrentA
   */
  currentA: number;

  /** 定格運転電流（表示・参考用） */
  ratedCurrentA: number;

  /** 最大運転電流 */
  maxCurrentA: number;

  /** 推奨ブレーカー容量 */
  breakerAmp: number;

  /** ブレーカー極数 */
  breakerPoles: string;

  /** エアコン能力 */
  capacityKw: number;

  /** 目安畳数 */
  tatamiStandard: string;
}

// ==========================================
// デフォルト
// ==========================================

const DEFAULTS: AirconInputParams = {
  areaValue: 12,
  unit: "tatami",
  roomType: "living",
  buildingType: "wooden",
  personCount: 2,
  hasStrongSunlight: false,
  isTopFloor: false,
  hasHighCeiling: false,
};

// ==========================================
// モジュールスコープの状態（画面を切り替えても値を保持）
// ==========================================

const areaValue = ref<number>(DEFAULTS.areaValue);
const areaUnit = ref<AreaUnit>(DEFAULTS.unit!);
const roomType = ref<RoomType>(DEFAULTS.roomType!);
const buildingType = ref<BuildingType>(DEFAULTS.buildingType!);
const personCount = ref<number>(DEFAULTS.personCount!);
const hasStrongSunlight = ref<boolean>(DEFAULTS.hasStrongSunlight!);
const isTopFloor = ref<boolean>(DEFAULTS.isTopFloor!);
const hasHighCeiling = ref<boolean>(DEFAULTS.hasHighCeiling!);

const showSpecTable = ref<boolean>(false);

// ==========================================
// Composable
// ==========================================

export function useAirconCable(initialParams?: Partial<AirconInputParams>) {
  // 初期引数が渡された場合のみ、値を更新する（初期化ロジックの互換性維持）
  if (initialParams) {
    if (initialParams.areaValue !== undefined) areaValue.value = initialParams.areaValue;
    if (initialParams.unit !== undefined) areaUnit.value = initialParams.unit;
    if (initialParams.roomType !== undefined) roomType.value = initialParams.roomType;
    if (initialParams.buildingType !== undefined) buildingType.value = initialParams.buildingType;
    if (initialParams.personCount !== undefined) personCount.value = initialParams.personCount;
    if (initialParams.hasStrongSunlight !== undefined) hasStrongSunlight.value = initialParams.hasStrongSunlight;
    if (initialParams.isTopFloor !== undefined) isTopFloor.value = initialParams.isTopFloor;
    if (initialParams.hasHighCeiling !== undefined) hasHighCeiling.value = initialParams.hasHighCeiling;
  }

  // ==========================================
  // 入力パラメータ
  // ==========================================

  const inputParams = computed<AirconInputParams>(() => ({
    areaValue: areaValue.value,

    unit: areaUnit.value,

    roomType: roomType.value,

    buildingType: buildingType.value,

    personCount: personCount.value,

    hasStrongSunlight: hasStrongSunlight.value,

    isTopFloor: isTopFloor.value,

    hasHighCeiling: hasHighCeiling.value,
  }));

  // ==========================================
  // 選定結果
  // ==========================================

  const selectionResult = computed(() => {
    return calculateAirconSelection(inputParams.value);
  });

  // ==========================================
  // 配線計算用電流
  // ==========================================

  /**
   * ★重要
   *
   * 配線計算に使用する電流値。
   *
   * ratedCurrentA は使用しない。
   * 必ず maxCurrentA を使用する。
   */
  const cableCalculationCurrentA = computed<number>(() => {
    return selectionResult.value.selectedSpec.maxCurrentA;
  });

  // ==========================================
  // 配線連携Payload
  // ==========================================

  const getCableSelectionPayload = (): AirconCableSelectionPayload => {
    const spec = selectionResult.value.selectedSpec;

    return {
      cableType: spec.cableTypeCode,

      wireSize: spec.recommendedWireSize,

      voltage: spec.voltage,

      // ★配線計算電流
      currentA: spec.maxCurrentA,

      // 参考値
      ratedCurrentA: spec.ratedCurrentA,

      // 最大電流
      maxCurrentA: spec.maxCurrentA,

      breakerAmp: spec.breakerAmp,

      breakerPoles: spec.breakerPoles,

      capacityKw: spec.capacityKw,

      tatamiStandard: spec.tatamiStandard,
    };
  };

  // ==========================================
  // マスタ表示
  // ==========================================

  const toggleSpecTable = () => {
    showSpecTable.value = !showSpecTable.value;
  };

  // ==========================================
  // リセット
  // ==========================================

  const resetInputs = () => {
    areaValue.value = DEFAULTS.areaValue;

    areaUnit.value = DEFAULTS.unit!;

    roomType.value = DEFAULTS.roomType!;

    buildingType.value = DEFAULTS.buildingType!;

    personCount.value = DEFAULTS.personCount!;

    hasStrongSunlight.value = DEFAULTS.hasStrongSunlight!;

    isTopFloor.value = DEFAULTS.isTopFloor!;

    hasHighCeiling.value = DEFAULTS.hasHighCeiling!;
  };

  // ==========================================
  // 外部から入力条件設定
  // ==========================================

  const setInputParams = (params: Partial<AirconInputParams>) => {
    if (params.areaValue !== undefined) {
      areaValue.value = params.areaValue;
    }

    if (params.unit !== undefined) {
      areaUnit.value = params.unit;
    }

    if (params.roomType !== undefined) {
      roomType.value = params.roomType;
    }

    if (params.buildingType !== undefined) {
      buildingType.value = params.buildingType;
    }

    if (params.personCount !== undefined) {
      personCount.value = params.personCount;
    }

    if (params.hasStrongSunlight !== undefined) {
      hasStrongSunlight.value = params.hasStrongSunlight;
    }

    if (params.isTopFloor !== undefined) {
      isTopFloor.value = params.isTopFloor;
    }

    if (params.hasHighCeiling !== undefined) {
      hasHighCeiling.value = params.hasHighCeiling;
    }
  };

  return {
    // State
    areaValue,
    areaUnit,
    roomType,
    buildingType,
    personCount,
    hasStrongSunlight,
    isTopFloor,
    hasHighCeiling,

    // UI
    showSpecTable,

    // Computed
    inputParams,
    selectionResult,

    // ★ maxCurrentA
    cableCalculationCurrentA,

    // Master
    acMasterSpecs: AC_SPECS,

    // Actions
    toggleSpecTable,
    resetInputs,
    setInputParams,

    // Integration
    getCableSelectionPayload,
  };
}