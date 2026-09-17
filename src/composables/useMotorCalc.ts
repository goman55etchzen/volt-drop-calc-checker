import { ref, computed } from 'vue';
import { BREAKER_SIZES, EnvironmentType } from '@/types/appDefinitions';
import {
  calculateMotorGrounding,
  selectMotorELCB,
  calculatePhaseCapacitor,
} from '@/utils/motorOmega';

export function useMotorCalc() {
  const outputKw = ref<number>(5.5);
  const voltage = ref<number>(200);
  const powerFactor = ref<number>(0.85);
  const targetPowerFactor = ref<number>(0.95);
  const efficiency = ref<number>(0.85);
  const environment = ref<EnvironmentType>('normal');

  const calculatedAmp = computed(() => {
    const pWatt = outputKw.value * 1000;
    const denominator = Math.sqrt(3) * voltage.value * powerFactor.value * efficiency.value;
    if (denominator <= 0) return 0;
    return Number((pWatt / denominator).toFixed(2));
  });

  const simpleAmp = computed(() => {
    if (voltage.value >= 400) {
      return Number((outputKw.value * 2).toFixed(1));
    }
    return Number((outputKw.value * 4).toFixed(1));
  });

  const requiredWireAmp = computed(() => {
    const amp = calculatedAmp.value;
    if (amp <= 50) {
      return Number((amp * 1.25).toFixed(2));
    }
    return Number((amp * 1.1).toFixed(2));
  });

  const breakerCapacity = computed(() => {
    const amp = calculatedAmp.value;
    const target = amp * 3.0;
    const recommended =
      BREAKER_SIZES.find((s) => s >= target) || BREAKER_SIZES[BREAKER_SIZES.length - 1];

    return {
      rawTarget: Number(target.toFixed(1)),
      recommended,
    };
  });

  const groundingInfo = computed(() =>
    calculateMotorGrounding(voltage.value, environment.value)
  );

  const elcbInfo = computed(() =>
    selectMotorELCB(calculatedAmp.value, environment.value, BREAKER_SIZES)
  );

  const capacitorInfo = computed(() =>
    calculatePhaseCapacitor(outputKw.value, powerFactor.value, targetPowerFactor.value, voltage.value)
  );

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
    calculatedAmp,
    simpleAmp,
    requiredWireAmp,
    breakerCapacity,
    groundingInfo,
    elcbInfo,
    capacitorInfo,
    setPreset,
  };
}