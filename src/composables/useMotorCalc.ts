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

  // 幹線電線の最小許容電流（多台数・他負荷対応）
  const requiredWireAmp = computed(() => {
    // 1台のみかつ他負荷なしの場合は基礎計算結果を使用
    if (motorCount.value === 1 && otherLoadAmp.value === 0) {
      return currentCalcResult.value.requiredWireAmp;
    }

    // 多台数・他負荷の幹線計算式
    // Im = 電動機全定格電流の和, Ir = その他負荷電流
    const sumIm = calculatedAmp.value * motorCount.value;
    const sumIr = otherLoadAmp.value;

    if (sumIm <= 50) {
      return sumIm * 1.25 + sumIr;
    } else {
      return sumIm * 1.1 + sumIr;
    }
  });

  // 合算負荷電流
  const totalLoadAmp = computed(() => {
    return calculatedAmp.value * motorCount.value + otherLoadAmp.value;
  });

  const groundingInfo = computed(() => currentCalcResult.value.groundingInfo);
  const capacitorInfo = computed(() => currentCalcResult.value.capacitorInfo);

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

  // 配線用遮断器 / モーターブレーカー選定（電線許容電流 wireAllowAmp を引数に追加）
  const breakerInfo = computed<MotorBreakerSelectionResult>(() => {
    if (driveMode.value === 'inverter') {
      return currentCalcResult.value.breakerInfo;
    }

    return selectMotorBreaker({
      outputKw: outputKw.value,
      singleAmp: calculatedAmp.value,
      motorCount: motorCount.value,
      otherLoadAmp: otherLoadAmp.value,
      wireAllowAmp: requiredWireAmp.value,
      breakerTypeMode: breakerTypeMode.value,
      driveMode: driveMode.value,
    });
  });

  // 漏電遮断器選定（電線許容電流 wireAllowAmp を引数に追加）
  const elcbInfo = computed(() => {
    return selectElcb({
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

  // ブレーカー容量計算サマリ
  const breakerCapacity = computed(() => {
    const rawTarget = calculatedAmp.value * motorCount.value * 3.0 + otherLoadAmp.value;
    const recommended = breakerInfo.value.recommendedAmp;

    return {
      rawTarget: Number(rawTarget.toFixed(1)),
      recommended,
    };
  });

  // プリセット設定（kW変更時の標準力率自動アサイン）
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