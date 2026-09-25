import { ref, computed, type Ref } from "vue";

import { EquipmentInputMode, type CableTypeCode } from "@/types/appDefinitions";

// ==========================================
// エアコン連携Payload
// ==========================================

export interface AirconEquipmentPreset {
  /** ケーブル種別 */
  cableType: CableTypeCode;

  /** 推奨電線サイズ */
  wireSize: string;

  /** 電源電圧 */
  voltage: number;

  /**
   * 配線計算に使用する電流値
   *
   * ★エアコンでは maxCurrentA
   */
  currentA: number;

  /** 定格運転電流 */
  ratedCurrentA: number;

  /** 最大運転電流 */
  maxCurrentA: number;

  /** 推奨ブレーカー容量 */
  breakerAmp: number;

  /** ブレーカー極数 */
  breakerPoles?: string;

  /** エアコン能力 */
  capacityKw?: number;

  /** 目安畳数 */
  tatamiStandard?: string;
}

// ==========================================
// Composable
// ==========================================

export function useEquipment(voltage: Ref<number>) {
  // ==========================================
  // 通常設備入力
  // ==========================================

  const inputMode = ref<EquipmentInputMode>("device_watt");

  const unitWatt = ref<number>(60);

  const unitCount = ref<number>(10);

  const customDeviceAmp = ref<number>(10);

  const breakerAmp = ref<number>(20);

  // ==========================================
  // エアコン連携状態
  // ==========================================

  const selectedWireSize = ref<string>("");

  const selectedCableType = ref<CableTypeCode | null>(null);

  const selectedMaxCurrentA = ref<number | null>(null);

  const selectedRatedCurrentA = ref<number | null>(null);

  const selectedBreakerPoles = ref<string>("");

  // ==========================================
  // 総電流
  // ==========================================

  const totalI = computed<number>(() => {
    const v = voltage.value || 1;

    // ----------------------------------------
    // ワット入力
    // ----------------------------------------

    if (inputMode.value === "device_watt") {
      return ((unitWatt.value || 0) * (unitCount.value || 0)) / v;
    }

    // ----------------------------------------
    // 電流値直接入力
    // ----------------------------------------

    if (inputMode.value === "device_amp") {
      return customDeviceAmp.value || 0;
    }

    // ----------------------------------------
    // ブレーカー基準
    // ----------------------------------------

    return (breakerAmp.value || 0) * 0.85;
  });

  // ==========================================
  // エアコン選定結果を適用
  // ==========================================

  const applyAirconSelection = (payload: AirconEquipmentPreset) => {
    // ----------------------------------------
    // 1. 電流直接入力モード
    // ----------------------------------------

    inputMode.value = "device_amp";

    // ----------------------------------------
    // 2. 配線計算電流
    //
    // ★currentA = maxCurrentA
    // ----------------------------------------

    customDeviceAmp.value = payload.currentA;

    // ----------------------------------------
    // 3. 電圧
    // ----------------------------------------

    voltage.value = payload.voltage;

    // ----------------------------------------
    // 4. ブレーカー
    // ----------------------------------------

    breakerAmp.value = payload.breakerAmp;

    // ----------------------------------------
    // 5. 電線
    // ----------------------------------------

    selectedWireSize.value = payload.wireSize;

    selectedCableType.value = payload.cableType;

    // ----------------------------------------
    // 6. 電流値保持
    // ----------------------------------------

    selectedMaxCurrentA.value = payload.maxCurrentA;

    selectedRatedCurrentA.value = payload.ratedCurrentA;

    // ----------------------------------------
    // 7. ブレーカー極数
    // ----------------------------------------

    selectedBreakerPoles.value = payload.breakerPoles ?? "";
  };

  // ==========================================
  // エアコン連携状態クリア
  // ==========================================

  const clearAirconSelection = () => {
    selectedWireSize.value = "";

    selectedCableType.value = null;

    selectedMaxCurrentA.value = null;

    selectedRatedCurrentA.value = null;

    selectedBreakerPoles.value = "";
  };

  return {
    // Input
    inputMode,
    unitWatt,
    unitCount,
    customDeviceAmp,
    breakerAmp,

    // Aircon
    selectedWireSize,
    selectedCableType,
    selectedMaxCurrentA,
    selectedRatedCurrentA,
    selectedBreakerPoles,

    // Computed
    totalI,

    // Actions
    applyAirconSelection,
    clearAirconSelection,
  };
}
