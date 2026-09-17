import { ref, computed } from 'vue';
import {
  BREAKER_SIZES,
  EnvironmentType,
  PowerFrequency,
  MotorBreakerType,
  MotorBreakerSelectionResult,
} from '@/types/appDefinitions';
import { useOmega } from '@/composables/useOmega';

export function useMotorCalc() {
  // 入力パラメータ State
  const outputKw = ref<number>(5.5);
  const voltage = ref<number>(200);
  const powerFactor = ref<number>(0.85);
  const targetPowerFactor = ref<number>(0.95);
  const efficiency = ref<number>(0.85);
  const environment = ref<EnvironmentType>('normal');
  const frequency = ref<PowerFrequency>(50);

  // ブレーカー選択モード ('auto' | 'motor_breaker' | 'mccb')
  const breakerTypeMode = ref<MotorBreakerType>('auto');

  // 定格電流計算 (In = P / (√3 * V * cosθ * η))
  const calculatedAmp = computed(() => {
    const pWatt = outputKw.value * 1000;
    const denominator = Math.sqrt(3) * voltage.value * powerFactor.value * efficiency.value;
    if (denominator <= 0) return 0;
    return Number((pWatt / denominator).toFixed(2));
  });

  // 簡易目安電流
  const simpleAmp = computed(() => {
    if (voltage.value >= 400) {
      return Number((outputKw.value * 2).toFixed(1));
    }
    return Number((outputKw.value * 4).toFixed(1));
  });

  // 許容電流基準 (50A以下: 1.25倍 / 50A超: 1.1倍)
  const requiredWireAmp = computed(() => {
    const amp = calculatedAmp.value;
    if (amp <= 50) {
      return Number((amp * 1.25).toFixed(2));
    }
    return Number((amp * 1.1).toFixed(2));
  });

  // 既存互換用ブレーカー計算 (定格×3倍を目安)
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

  // ブレーカー選定詳細ロジック (15kW超の自動MCCB切り替え対応)
  const breakerInfo = computed<MotorBreakerSelectionResult>(() => {
    const kw = outputKw.value;
    const amp = calculatedAmp.value;
    const isOver15kW = kw > 15.0;

    let selectedType: 'motor_breaker' | 'mccb' = 'motor_breaker';
    if (isOver15kW) {
      selectedType = 'mccb';
    } else if (breakerTypeMode.value === 'auto') {
      selectedType = 'motor_breaker';
    } else {
      selectedType = breakerTypeMode.value;
    }

    const target = amp * 3.0;
    const recommendedAmp =
      BREAKER_SIZES.find((s) => s >= target) || BREAKER_SIZES[BREAKER_SIZES.length - 1];

    const requiresThermalRelay = selectedType === 'mccb';

    let warningNote: string | undefined = undefined;
    if (isOver15kW) {
      warningNote =
        '15kWを超える電動機のため、モーターブレーカーは使用できません。配線用遮断器（MCCB）とサーマルリレーを併用してください。';
    } else if (selectedType === 'mccb') {
      warningNote =
        '配線用遮断器（MCCB）を使用する場合は、電動機保護のためサーマルリレー（電磁開閉器）の併設が必要です。';
    }

    return {
      selectedType,
      recommendedAmp,
      requiresThermalRelay,
      isOver15kW,
      warningNote,
    };
  });

  // 新規 useOmega を利用した計算呼び出し
  const { groundingInfo, elcbInfo, capacitorInfo } = useOmega(
    voltage,
    environment,
    calculatedAmp,
    outputKw,
    powerFactor,
    targetPowerFactor,
    frequency
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
    frequency,
    breakerTypeMode,
    calculatedAmp,
    simpleAmp,
    requiredWireAmp,
    breakerCapacity,
    breakerInfo,
    groundingInfo,
    elcbInfo,
    capacitorInfo,
    setPreset,
  };
}