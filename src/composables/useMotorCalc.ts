// composables/useMotorCalc.ts
import { ref, computed, watch, onMounted } from 'vue';
import {
  EnvironmentType,
  PowerFrequency,
  MotorBreakerType,
  MotorBreakerSelectionResult,
} from '@/types/appDefinitions';
import { processDirectMotorCalc } from '@/utils/directMotorCalc';
import { processInverterMotorCalc } from '@/utils/inverterMotorCalc';
import {
  CapacitorProduct,
  fetchCapacitorCatalog,
  findClosestCapacitorGroup,
} from '@/utils/capacitor';
import { selectMotorBreaker, selectElcb } from '@/utils/breakerSelect';

export type DriveMode = 'direct' | 'inverter';

export function useMotorCalc() {
  // 入力パラメータ State
  const outputKw = ref<number>(5.5);
  const voltage = ref<number>(200);
  const powerFactor = ref<number>(0.85);
  const targetPowerFactor = ref<number>(0.95);
  const efficiency = ref<number>(0.85);
  const environment = ref<EnvironmentType>('normal');
  const frequency = ref<PowerFrequency>(50);

  // 多台数・他負荷 State
  const motorCount = ref<number>(1);
  const otherLoadAmp = ref<number>(0);

  // 駆動モード ('direct' | 'inverter')
  const driveMode = ref<DriveMode>('direct');

  // ブレーカー選択モード ('auto' | 'motor_breaker' | 'mccb')
  const breakerTypeMode = ref<MotorBreakerType>('auto');

  // カタログデータ状態
  const capacitorCatalog = ref<CapacitorProduct[]>([]);

  onMounted(async () => {
    capacitorCatalog.value = await fetchCapacitorCatalog();
  });

  watch(driveMode, (newMode) => {
    if (newMode === 'inverter') {
      breakerTypeMode.value = 'mccb';
    }
  });

  const currentCalcResult = computed(() => {
    const params = {
      outputKw: outputKw.value,
      voltage: voltage.value,
      powerFactor: powerFactor.value,
      targetPowerFactor: targetPowerFactor.value,
      efficiency: efficiency.value,
      environment: environment.value,
      frequency: frequency.value,
      breakerTypeMode: breakerTypeMode.value,
    };

    if (driveMode.value === 'inverter') {
      return processInverterMotorCalc(params);
    }
    return processDirectMotorCalc(params);
  });

  const calculatedAmp = computed(() => currentCalcResult.value.calculatedAmp);
  const simpleAmp = computed(() => currentCalcResult.value.simpleAmp);
  const requiredWireAmp = computed(() => currentCalcResult.value.requiredWireAmp);

  const totalLoadAmp = computed(() => {
    return calculatedAmp.value * motorCount.value + otherLoadAmp.value;
  });

  const groundingInfo = computed(() => currentCalcResult.value.groundingInfo);
  const capacitorInfo = computed(() => currentCalcResult.value.capacitorInfo);

  const matchedCapacitors = computed(() => {
    if (driveMode.value === 'inverter') return [];
    return findClosestCapacitorGroup(
      capacitorCatalog.value,
      voltage.value,
      frequency.value,
      capacitorInfo.value.recommendedMicroFarad
    );
  });

  // 過電流遮断器選定（utilsに統合）
  const breakerInfo = computed<MotorBreakerSelectionResult>(() => {
    if (driveMode.value === 'inverter') {
      return currentCalcResult.value.breakerInfo;
    }

    return selectMotorBreaker({
      outputKw: outputKw.value,
      singleAmp: calculatedAmp.value,
      motorCount: motorCount.value,
      otherLoadAmp: otherLoadAmp.value,
      breakerTypeMode: breakerTypeMode.value,
      driveMode: driveMode.value,
    });
  });

  // 漏電遮断器選定（utilsに統合）
  const elcbInfo = computed(() => {
    return selectElcb({
      outputKw: outputKw.value,
      singleAmp: calculatedAmp.value,
      motorCount: motorCount.value,
      otherLoadAmp: otherLoadAmp.value,
      breakerTypeMode: breakerTypeMode.value,
      driveMode: driveMode.value,
      environment: environment.value,
    });
  });

  const breakerCapacity = computed(() => {
    const target = calculatedAmp.value * motorCount.value * 3.0 + otherLoadAmp.value;
    const recommended = breakerInfo.value.recommendedAmp;

    return {
      rawTarget: Number(target.toFixed(1)),
      recommended,
    };
  });

  const setPreset = (kw: number) => {
    outputKw.value = kw;
    if (kw <= 2.2) {
      powerFactor.value = 0.80;
    } else if (kw <= 7.5) {
      powerFactor.value = 0.85;
    } else {
      powerFactor.value = 0.88;
    }
  };

  return {
    outputKw,
    voltage,
    powerFactor,
    targetPowerFactor,
    efficiency,
    environment,
    frequency,
    driveMode,
    breakerTypeMode,
    motorCount,
    otherLoadAmp,
    calculatedAmp,
    simpleAmp,
    totalLoadAmp,
    requiredWireAmp,
    breakerCapacity,
    breakerInfo,
    groundingInfo,
    elcbInfo,
    capacitorInfo,
    matchedCapacitors,
    setPreset,
  };
}