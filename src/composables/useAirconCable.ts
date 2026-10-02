// src/composables/useAirconCable.ts
import { ref, computed } from "vue";

import {
  type AreaUnit,
  type RoomType,
  type BuildingType,
  type AirconInputParams,
  type AirconCableSelectionPayload,
  type WireLimitRow,
  DEFAULT_AIRCON_INPUTS,
  AC_SPECS,
  WIRE_SIZE_CANDIDATES,
  AIRCON_WIRE_COUNT,
} from "@/base/airconBase";
import { CableBase } from "@/base/cableBase";
import {
  calculateAirconSelection,
  calculateAirconMaxDistance,
  getAirconSystemId,
} from "@/utils/airconCalc";

export type { AirconCableSelectionPayload } from "@/base/airconBase";

const areaValue = ref<number>(DEFAULT_AIRCON_INPUTS.areaValue);
const areaUnit = ref<AreaUnit>(DEFAULT_AIRCON_INPUTS.unit);
const roomType = ref<RoomType>(DEFAULT_AIRCON_INPUTS.roomType);
const buildingType = ref<BuildingType>(DEFAULT_AIRCON_INPUTS.buildingType);
const personCount = ref<number>(DEFAULT_AIRCON_INPUTS.personCount);
const hasStrongSunlight = ref<boolean>(DEFAULT_AIRCON_INPUTS.hasStrongSunlight);
const isTopFloor = ref<boolean>(DEFAULT_AIRCON_INPUTS.isTopFloor);
const hasHighCeiling = ref<boolean>(DEFAULT_AIRCON_INPUTS.hasHighCeiling);
/** 許容電圧降下率 [%]（2.0 / 3.0） */
const targetDropRatio = ref<number>(DEFAULT_AIRCON_INPUTS.targetVoltageDropRatio);
/** 予定配線長 [m]（0 = 未指定） */
const wiringDistance = ref<number>(DEFAULT_AIRCON_INPUTS.wiringDistanceMeters);

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
  if (params.targetVoltageDropRatio !== undefined) targetDropRatio.value = params.targetVoltageDropRatio;
  if (params.wiringDistanceMeters !== undefined) wiringDistance.value = params.wiringDistanceMeters;
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
    targetVoltageDropRatio: targetDropRatio.value,
    wiringDistanceMeters: wiringDistance.value,
  }));

  const selectionResult = computed(() =>
    calculateAirconSelection(inputParams.value)
  );

  const cableCalculationCurrentA = computed<number>(
    () => selectionResult.value.selectedSpec.maxCurrentA
  );

  /** 選定機種に対する、電線サイズ別の限界配線長一覧 */
  const wireLimitTable = computed<WireLimitRow[]>(() => {
    const spec = selectionResult.value.selectedSpec;
    return WIRE_SIZE_CANDIDATES.map((c) => {
      const r = calculateAirconMaxDistance(spec, targetDropRatio.value, c.name);
      const allowAmpA = CableBase.getAllowableCurrent(
        spec.cableTypeCode,
        c.name,
        30,
        AIRCON_WIRE_COUNT
      ).totalAllowAmp;
      return {
        name: c.name,
        area: c.area,
        maxDistanceMeters: r.maxDistanceMeters,
        maxDistance3PercentMeters: r.maxDistance3PercentMeters,
        allowAmpA,
        heatOk: allowAmpA >= spec.maxCurrentA,
        isRecommended: c.name === spec.recommendedWireSize,
      };
    });
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
      targetDropPercent: targetDropRatio.value,
      wiringDistanceMeters: wiringDistance.value,
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
    targetDropRatio,
    wiringDistance,

    showSpecTable,

    inputParams,
    selectionResult,
    cableCalculationCurrentA,
    wireLimitTable,

    acMasterSpecs: AC_SPECS,

    toggleSpecTable,
    resetInputs,
    setInputParams,

    getCableSelectionPayload,
  };
}
