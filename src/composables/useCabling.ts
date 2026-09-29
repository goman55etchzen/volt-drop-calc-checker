// src/composables/useCabling.ts
import { ref, computed, type Ref } from "vue";
import CableBase, {
  SYSTEM_DEFINITIONS,
  CABLE_TYPES,
  type VoltageDropParams,
  type WireSelectionParams,
  type SystemType,
  type CableTypeCode,
  type AvailableWireResult,
  type CableType,
} from "@/base/cableBase";

export const SYSTEM_TYPES: SystemType[] = SYSTEM_DEFINITIONS;

export interface UseCablingOptions {
  ambientTemp?: Ref<number>;
  wireCount?: Ref<number>;
  parallelCount?: Ref<number>;
  powerFactor?: Ref<number>;
  useImpedance?: Ref<boolean>;
  distance?: Ref<number>;
}

export function useCabling(
  voltage: Ref<number>,
  totalI: Ref<number>,
  selectedWireName: Ref<string>,
  selectedCableId: Ref<string | CableTypeCode>,
  targetPercent: Ref<number>,
  options: UseCablingOptions = {},
) {
  const selectedSystemId = ref<string>("1P2W");

  const ambientTemp = options.ambientTemp ?? ref(30);
  const wireCount = options.wireCount ?? ref(1);
  const parallelCount = options.parallelCount ?? ref(1);
  const powerFactor = options.powerFactor ?? ref(1.0);
  const useImpedance = options.useImpedance ?? ref(false);
  const distance = options.distance ?? ref(0);

  const currentSystem = computed(() =>
    CableBase.getSystem(selectedSystemId.value),
  );

  const currentCable = computed<CableType | undefined>(() => {
    const cableId = selectedCableId.value as CableTypeCode;
    return CABLE_TYPES.find((c) => c.id === cableId);
  });

  const cableTypeDefinition = computed<CableType | undefined>(() => {
    return currentCable.value;
  });

  const currentWire = computed(() => {
    const wire = CableBase.getWireSize(selectedWireName.value);
    if (wire) return wire;

    const spec = CableBase.getCableSpec(selectedWireName.value);
    return {
      name: selectedWireName.value,
      area: spec?.area ?? 0,
      amp: 0,
    };
  });

  const allowDropV = computed(
    () => voltage.value * (targetPercent.value / 100),
  );

  const maxLen = computed(() => {
    return CableBase.calculateMaxDistance(
      voltage.value,
      targetPercent.value,
      totalI.value,
      selectedWireName.value,
      selectedSystemId.value,
      powerFactor.value,
      useImpedance.value,
    );
  });

  const voltageDrop = computed(() => {
    if (distance.value <= 0) return 0;
    const params: VoltageDropParams = {
      systemId: selectedSystemId.value,
      current: totalI.value,
      distance: distance.value,
      wireSizeName: selectedWireName.value,
      powerFactor: powerFactor.value,
      useImpedance: useImpedance.value,
    };
    return CableBase.calculateVoltageDrop(params);
  });

  const voltageDropPercent = computed(() => {
    if (voltage.value <= 0) return 0;
    return (voltageDrop.value / voltage.value) * 100;
  });

  const isWireSizeValidForCable = computed(() => {
    return CableBase.isValidWireSize(selectedWireName.value);
  });

  const allowableCurrentInfo = computed(() => {
    const cableType = selectedCableId.value as CableTypeCode;
    return CableBase.getAllowableCurrent(
      cableType,
      selectedWireName.value,
      ambientTemp.value,
      wireCount.value,
      parallelCount.value,
    );
  });

  const maxLimit = computed(() => {
    const calculated = allowableCurrentInfo.value.totalAllowAmp;
    if (calculated > 0) return calculated;
    return Infinity;
  });

  const isOverCurrent = computed(() => {
    if (!isWireSizeValidForCable.value) return false;
    return totalI.value > maxLimit.value;
  });

  const selectionParams = computed<WireSelectionParams>(() => ({
    systemId: selectedSystemId.value,
    voltage: voltage.value,
    targetDropPercent: targetPercent.value,
    current: totalI.value,
    distance: distance.value,
    cableType: selectedCableId.value as CableTypeCode,
    ambientTemp: ambientTemp.value,
    wireCount: wireCount.value,
    parallelCount: parallelCount.value,
    powerFactor: powerFactor.value,
  }));

  const allWireEvaluations = computed<AvailableWireResult[]>(() => {
    return CableBase.evaluateAllWireSizes(selectionParams.value);
  });

  const suitableWire = computed<AvailableWireResult | null>(() => {
    return CableBase.selectSuitableWireSize(selectionParams.value);
  });

  const isIndoorWiringForbidden = computed(() =>
    CableBase.isIndoorWiringForbidden(selectedCableId.value as CableTypeCode),
  );

  const indoorWiringWarning = computed(() => {
    if (!isIndoorWiringForbidden.value) return "";
    const cable = currentCable.value;
    if (cable?.warningMessage) {
      return cable.warningMessage;
    }
    return "屋内固定配線には使用できません。";
  });

  const stepWireSize = (step: "next" | "prev") => {
    const nextName = CableBase.getAdjacentWireSize(
      selectedWireName.value,
      step,
    );
    selectedWireName.value = nextName;
  };

  return {
    selectedSystemId,
    SYSTEM_TYPES,
    currentSystem,
    currentCable,
    cableTypeDefinition,
    currentWire,
    maxLen,
    isOverCurrent,
    isWireSizeValidForCable,
    isIndoorWiringForbidden,
    indoorWiringWarning,
    allowDropV,
    voltageDrop,
    voltageDropPercent,
    maxLimit,
    allowableCurrentInfo,
    allWireEvaluations,
    suitableWire,
    stepWireSize,
  };
}
