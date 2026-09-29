// src/composables/useMotorCalc.ts
import { ref, computed, watch, onMounted } from 'vue';
import {
  EnvironmentType,
  PowerFrequency,
  MotorBreakerType,
} from '@/types/appDefinitions';
import { processDirectMotorCalc } from '@/utils/directMotorCalc';
import { processInverterMotorCalc } from '@/utils/inverterMotorCalc';
import {
  CapacitorProduct,
  fetchCapacitorCatalog,
  findClosestCapacitorGroup,
} from '@/utils/capacitor';
import { selectExtendedMotorBreaker } from '@/base/breakerBase';
import { useElb } from './useElb';

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

  // 駆動モード変更時の自動切替（インバータ時はMCCB固定）
  watch(driveMode, (newMode) => {
    if (newMode === 'inverter') {
      breakerTypeMode.value = 'mccb';
    }
  });

  // 基礎計算（直結 vs インバータ）
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

  // 全電動機の定格電流の合計 (∑IM)
  const totalMotorAmp = computed(() => calculatedAmp.value * motorCount.value);

  // 合算負荷電流 (∑IM + ∑IL)
  const totalLoadAmp = computed(() => totalMotorAmp.value + otherLoadAmp.value);

  // 幹線電線の最小許容電流 (IW)
  const requiredWireAmp = computed(() => {
    if (motorCount.value === 1 && otherLoadAmp.value === 0) {
      return currentCalcResult.value.requiredWireAmp;
    }

    const sumIm = totalMotorAmp.value;
    const sumIr = otherLoadAmp.value;

    if (sumIm <= 50) {
      return sumIm * 1.25 + sumIr;
    } else {
      return sumIm * 1.1 + sumIr;
    }
  });

  const groundingInfo = computed(() => currentCalcResult.value.groundingInfo);

  // 進相コンデンサ情報
  const capacitorInfo = computed(() => {
    const base = currentCalcResult.value.capacitorInfo;
    const count = motorCount.value;
    return {
      ...base,
      motorCount: count,
      description: count > 1
        ? `${base.description} （※${count}台の電動機それぞれに個別で1台ずつ設置：計${count}台必要）`
        : base.description
    };
  });

  // 適合コンデンサ検索
  const matchedCapacitors = computed(() => {
    if (driveMode.value === 'inverter') return [];
    return findClosestCapacitorGroup(
      capacitorCatalog.value,
      voltage.value,
      frequency.value,
      capacitorInfo.value.recommendedMicroFarad
    );
  });

  // 漏電遮断器選定（useElb Composable との連携）
  const { elcbInfo, extendedElcbInfo } = useElb(
    totalMotorAmp,
    otherLoadAmp,
    requiredWireAmp,
    environment
  );

  // モーター・配線用遮断器選定（拡張結果）
  const extendedBreakerInfo = computed(() => {
    return selectExtendedMotorBreaker({
      outputKw: outputKw.value,
      singleAmp: calculatedAmp.value,
      motorCount: motorCount.value,
      otherLoadAmp: otherLoadAmp.value,
      wireAllowAmp: requiredWireAmp.value,
      breakerTypeMode: breakerTypeMode.value,
      driveMode: driveMode.value,
      environment: environment.value,
    });
  });

  // 標準ブレーカー選定結果
  const breakerInfo = computed(() => {
    const ext = extendedBreakerInfo.value;
    return {
      selectedType: ext.selectedType,
      recommendedAmp: ext.recommendedAmp,
      requiresThermalRelay: ext.requiresThermalRelay,
      isOver15kW: ext.isOver15kW,
      warningNote: ext.warningNote
    };
  });

  // ブレーカー容量計算サマリ
  const breakerCapacity = computed(() => {
    const rawTarget = totalMotorAmp.value * 3.0 + otherLoadAmp.value;
    const recommended = breakerInfo.value.recommendedAmp;

    return {
      rawTarget: Number(rawTarget.toFixed(1)),
      recommended,
      motorCount: motorCount.value,
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
    motorCount,
    otherLoadAmp,
    calculatedAmp,
    simpleAmp,
    totalLoadAmp,
    requiredWireAmp,
    breakerCapacity,
    breakerInfo,
    extendedBreakerInfo,
    groundingInfo,
    elcbInfo,
    extendedElcbInfo,
    capacitorInfo,
    matchedCapacitors,
    setPreset,
    capacitorCatalog
  };
}