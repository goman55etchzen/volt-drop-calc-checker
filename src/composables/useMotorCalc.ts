// composables/useMotorCalc.ts
import { ref, computed, watch } from 'vue';
import {
  BREAKER_SIZES,
  EnvironmentType,
  PowerFrequency,
  MotorBreakerType,
  MotorBreakerSelectionResult,
} from '@/types/appDefinitions';
import { processDirectMotorCalc } from '@/utils/directMotorCalc';
import { processInverterMotorCalc } from '@/utils/inverterMotorCalc';

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

  // 駆動モード ('direct': 商用電源直結, 'inverter': インバータ駆動)
  const driveMode = ref<DriveMode>('direct');

  // ブレーカー選択モード ('auto' | 'motor_breaker' | 'mccb')
  const breakerTypeMode = ref<MotorBreakerType>('auto');

  // インバータ駆動時はモーターブレーカーが使用不可となるため、mccbに自動同期
  watch(driveMode, (newMode) => {
    if (newMode === 'inverter') {
      breakerTypeMode.value = 'mccb';
    }
  });

  // モード別計算ロジックの統合呼び出し
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

  // 算出プロパティ
  const calculatedAmp = computed(() => currentCalcResult.value.calculatedAmp);
  const simpleAmp = computed(() => currentCalcResult.value.simpleAmp);
  const requiredWireAmp = computed(() => currentCalcResult.value.requiredWireAmp);
  const groundingInfo = computed(() => currentCalcResult.value.groundingInfo);
  const elcbInfo = computed(() => currentCalcResult.value.elcbInfo);
  const capacitorInfo = computed(() => currentCalcResult.value.capacitorInfo);

  // ブレーカー選定情報
  const breakerInfo = computed<MotorBreakerSelectionResult>(() => {
    if (driveMode.value === 'inverter') {
      return currentCalcResult.value.breakerInfo;
    }

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

  // 既存互換用ブレーカー容量計算
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

  // プリセット設定
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