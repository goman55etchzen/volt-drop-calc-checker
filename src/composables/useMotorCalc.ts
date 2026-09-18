// composables/useMotorCalc.ts
import { ref, computed, watch, onMounted } from 'vue';
import {
  THREE_PHASE_BREAKER_SIZES,
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

  // ★ 多台数・他負荷 State
  const motorCount = ref<number>(1);       // 電動機台数 (初期値: 1台)
  const otherLoadAmp = ref<number>(0);     // その他一般負荷電流 (A)

  // 駆動モード ('direct': 商用電源直結, 'inverter': インバータ駆動)
  const driveMode = ref<DriveMode>('direct');

  // ブレーカー選択モード ('auto' | 'motor_breaker' | 'mccb')
  const breakerTypeMode = ref<MotorBreakerType>('auto');

  // カタログデータ状態
  const capacitorCatalog = ref<CapacitorProduct[]>([]);

  // 初期ロード
  onMounted(async () => {
    capacitorCatalog.value = await fetchCapacitorCatalog();
  });

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

  // 単体および合算計算プロパティ
  const calculatedAmp = computed(() => currentCalcResult.value.calculatedAmp);
  const simpleAmp = computed(() => currentCalcResult.value.simpleAmp);
  const requiredWireAmp = computed(() => currentCalcResult.value.requiredWireAmp);

  // 合算定格電流 (Im * 台数 + Ir)
  const totalLoadAmp = computed(() => {
    return calculatedAmp.value * motorCount.value + otherLoadAmp.value;
  });

  const groundingInfo = computed(() => currentCalcResult.value.groundingInfo);
  const capacitorInfo = computed(() => currentCalcResult.value.capacitorInfo);

  // 計算されたμF・電圧に合致する各社製品を抽出
  const matchedCapacitors = computed(() => {
    if (driveMode.value === 'inverter') return [];
    return findClosestCapacitorGroup(
      capacitorCatalog.value,
      voltage.value,
      frequency.value,
      capacitorInfo.value.recommendedMicroFarad
    );
  });

  // 過電流遮断器（MCCB / モータブレーカ）選定情報
  const breakerInfo = computed<MotorBreakerSelectionResult>(() => {
    if (driveMode.value === 'inverter') {
      return currentCalcResult.value.breakerInfo;
    }

    const kw = outputKw.value;
    const count = motorCount.value;
    const totalMotorAmp = calculatedAmp.value * count;
    const otherAmp = otherLoadAmp.value;
    const isOver15kW = kw > 15.0;

    let selectedType: 'motor_breaker' | 'mccb' = 'motor_breaker';
    if (isOver15kW || count > 1 || otherAmp > 0 || breakerTypeMode.value === 'mccb') {
      selectedType = 'mccb';
    } else if (breakerTypeMode.value === 'auto') {
      selectedType = 'motor_breaker';
    } else {
      selectedType = breakerTypeMode.value;
    }

    // 内線規程：過電流遮断器容量 (3 * Im + Ir)
    const target = totalMotorAmp * 3.0 + otherAmp;
    
    // 三相3線式用の遮断器定格サイズから選定（実用最小30A）
    const RECOMMENDED_MIN_AMP = 30;
    let recommendedAmp =
      THREE_PHASE_BREAKER_SIZES.find((s) => s >= target) ||
      THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];

    if (recommendedAmp < RECOMMENDED_MIN_AMP) {
      recommendedAmp = RECOMMENDED_MIN_AMP;
    }

    const requiresThermalRelay = selectedType === 'mccb';

    let warningNote: string | undefined = undefined;
    if (isOver15kW) {
      warningNote =
        '15kWを超える電動機のため、モーターブレーカーは使用できません。配線用遮断器（MCCB）とサーマルリレーを併用してください。';
    } else if (count > 1 || otherAmp > 0) {
      warningNote =
        '複数台運転または他負荷併設のため、個別モーター保護用にサーマルリレー（電磁開閉器）の併設が必要です。';
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

  // ELCB (漏電遮断器) 選定ロジック
  const elcbInfo = computed(() => {
    const count = motorCount.value;
    const totalMotorAmp = calculatedAmp.value * count;
    const otherAmp = otherLoadAmp.value;

    const rawTargetAmp = totalMotorAmp * 3.0 + otherAmp;

    // 最小サイズは三相標準の 30A 以上に補正
    const RECOMMENDED_MIN_AMP = 30;
    let selectedAmp = THREE_PHASE_BREAKER_SIZES.find((s) => s >= rawTargetAmp) || 300;
    if (selectedAmp < RECOMMENDED_MIN_AMP) {
      selectedAmp = RECOMMENDED_MIN_AMP;
    }

    // 感度電流判定: 50A以下は30mA、それ以上は100mA/200mA切替形等
    const sensitivityCurrent = selectedAmp <= 50 ? 30 : 100;

    return {
      recommendedAmp: selectedAmp,
      sensitivityCurrent,
      operatingTime: '0.1秒以内',
      isMandatory: environment.value === 'wet',
      description: count > 1 || otherAmp > 0
        ? `電動機${count}台＋他負荷（合計${totalLoadAmp.value.toFixed(1)}A）に対応する3P3W標準漏電遮断器を選定しています。`
        : '三相3線式標準の電動機保護用または漏電保護用ELCBを選定しています。'
    };
  });

  // 既存互換用ブレーカー容量計算
  const breakerCapacity = computed(() => {
    const target = (calculatedAmp.value * motorCount.value) * 3.0 + otherLoadAmp.value;
    let recommended =
      THREE_PHASE_BREAKER_SIZES.find((s) => s >= target) ||
      THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];

    if (recommended < 30) recommended = 30;

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