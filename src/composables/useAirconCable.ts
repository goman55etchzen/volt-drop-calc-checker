// src/composables/useAirconCable.ts
import { ref, computed } from 'vue';
import {
  AreaUnit,
  RoomType,
  BuildingType,
  AirconInputParams,
  calculateAirconSelection,
  AC_SPECS
} from '@/utils/airconCalc';
import { CableTypeCode } from '@/types/appDefinitions';

export function useAirconCable(initialParams?: Partial<AirconInputParams>) {
  // ==========================================
  // 1. 状態管理 (State)
  // ==========================================
  const areaValue = ref<number>(initialParams?.areaValue ?? 12);
  const areaUnit = ref<AreaUnit>(initialParams?.unit ?? 'tatami');
  const roomType = ref<RoomType>(initialParams?.roomType ?? 'living');
  const buildingType = ref<BuildingType>(initialParams?.buildingType ?? 'wooden');
  const personCount = ref<number>(initialParams?.personCount ?? 2);
  const hasStrongSunlight = ref<boolean>(initialParams?.hasStrongSunlight ?? false);
  const isTopFloor = ref<boolean>(initialParams?.isTopFloor ?? false);
  const hasHighCeiling = ref<boolean>(initialParams?.hasHighCeiling ?? false);

  // UI状態（アコーディオン表示切り替え等）
  const showSpecTable = ref<boolean>(false);

  // ==========================================
  // 2. 算出プロパティ (Computed)
  // ==========================================
  /** 入力パラメータを集約したオブジェクト */
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

  /** 高精度エアコン選定 & 専用回路計算結果 */
  const selectionResult = computed(() => {
    return calculateAirconSelection(inputParams.value);
  });

  // ==========================================
  // 3. アクション / 連携ヘルパー
  // ==========================================
  /** 配線計算ツール等へ連携するペイロード情報の取得 */
  const getCableSelectionPayload = () => {
    const spec = selectionResult.value.selectedSpec;
    return {
      cableType: spec.cableTypeCode as CableTypeCode,
      wireSize: spec.recommendedWireSize,
      voltage: spec.voltage,
      ratedCurrent: spec.ratedCurrentA,
      maxCurrent: spec.maxCurrentA,
      breakerAmp: spec.breakerAmp
    };
  };

  /** アコーディオン開閉トグル */
  const toggleSpecTable = () => {
    showSpecTable.value = !showSpecTable.value;
  };

  /** 入力状態のリセット */
  const resetInputs = () => {
    areaValue.value = 12;
    areaUnit.value = 'tatami';
    roomType.value = 'living';
    buildingType.value = 'wooden';
    personCount.value = 2;
    hasStrongSunlight.value = false;
    isTopFloor.value = false;
    hasHighCeiling.value = false;
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
    showSpecTable,

    // Computed
    inputParams,
    selectionResult,
    acMasterSpecs: AC_SPECS,

    // Actions / Helpers
    toggleSpecTable,
    resetInputs,
    getCableSelectionPayload,
  };
}