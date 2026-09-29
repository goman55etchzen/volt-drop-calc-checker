import { ref, computed } from "vue";

import {
  type AreaUnit,
  type RoomType,
  type BuildingType,
  type AirconInputParams,
  type AirconCableSelectionPayload,
  DEFAULT_AIRCON_INPUTS,
  calculateAirconSelection,
  getAirconSystemId,
  AC_SPECS,
} from "@/base/airconBase";

export type { AirconCableSelectionPayload } from "@/base/airconBase";

const areaValue = ref<number>(DEFAULT_AIRCON_INPUTS.areaValue);
const areaUnit = ref<AreaUnit>(DEFAULT_AIRCON_INPUTS.unit!);
const roomType = ref<RoomType>(DEFAULT_AIRCON_INPUTS.roomType!);
const buildingType = ref<BuildingType>(DEFAULT_AIRCON_INPUTS.buildingType!);
const personCount = ref<number>(DEFAULT_AIRCON_INPUTS.personCount!);
const hasStrongSunlight = ref<boolean>(DEFAULT_AIRCON_INPUTS.hasStrongSunlight!);
const isTopFloor = ref<boolean>(DEFAULT_AIRCON_INPUTS.isTopFloor!);
const hasHighCeiling = ref<boolean>(DEFAULT_AIRCON_INPUTS.hasHighCeiling!);

const showSpecTable = ref<boolean>(false);

function applyParams(params: Partial<AirconInputParams>) {
  if (params.areaValue !== undefined) areaValue.value = params.areaValue;
  if (params.unit !== undefined) areaUnit.value = params.unit;
  if (params.roomType !== undefined) roomType.value = params.roomType;
  if (params.buildingType !== undefined) buildingType.value = params.buildingType;
  if (params.personCount !== undefined) personCount.value = params.personCount;
  if (params.hasStrongSunlight !== undefined) hasStrongSunlight.value = params.hasStrongSunlight;
  if (params.isTopFloor !== undefined) isTopFloor.value = params.isTopFloor;
  if (params.hasHighCeiling !== undefined) hasHighCeiling.value = params.hasHighCeiling;
}

export function useAirconCable(initialParams?: Partial<AirconInputParams>) {
  if (initialParams) {
    applyParams(initialParams);
  }

  const inputParams = computed<AirconInputParams>(() => ({
    areaValue: areaValue.value,
    unit: areaUnit.value,
    roomType: roomType.value,
    buildingType: buildingType.value,
    personCount: personCount.value,
    hasStrongSunlight: hasStrongSunlight.value,
    isTopFloor: isTopFloor.value,
    hasHighCeiling: hasHighCeiling.value,
    targetVoltageDropRatio: 2.0,
  }));

  const selectionResult = computed(() => {
    return calculateAirconSelection(inputParams.value);
  });

  const cableCalculationCurrentA = computed<number>(() => {
    return selectionResult.value.selectedSpec.maxCurrentA;
  });

  const getCableSelectionPayload = (): AirconCableSelectionPayload => {
    const res = selectionResult.value;
    const spec = res.selectedSpec;

    return {
      cableType: spec.cableTypeCode,
      wireSize: spec.recommendedWireSize,
      voltage: spec.voltage,
      systemId: getAirconSystemId(spec),
      currentA: spec.maxCurrentA,
      ratedCurrentA: spec.ratedCurrentA,
      maxCurrentA: spec.maxCurrentA,
      breakerAmp: spec.breakerAmp,
      breakerPoles: spec.breakerPoles,
      capacityKw: spec.capacityKw,
      tatamiStandard: spec.tatamiStandard,
      maxDistanceMeters: res.maxDistanceInfo.maxDistanceMeters,
    };
  };

  const toggleSpecTable = () => {
    showSpecTable.value = !showSpecTable.value;
  };

  const resetInputs = () => {
    applyParams(DEFAULT_AIRCON_INPUTS);
  };

  const setInputParams = (params: Partial<AirconInputParams>) => {
    applyParams(params);
  };

  return {
    areaValue,
    areaUnit,
    roomType,
    buildingType,
    personCount,
    hasStrongSunlight,
    isTopFloor,
    hasHighCeiling,

    showSpecTable,

    inputParams,
    selectionResult,
    cableCalculationCurrentA,

    acMasterSpecs: AC_SPECS,

    toggleSpecTable,
    resetInputs,
    setInputParams,

    getCableSelectionPayload,
  };
}