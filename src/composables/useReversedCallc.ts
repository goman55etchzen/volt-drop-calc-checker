import { ref, computed, Ref } from 'vue';

export type LoadType = 'general' | 'motor';
export type InstallationType = 'conduit_3' | 'conduit_4' | 'open_air';
export type CableType = 'VV' | 'IV' | 'CV';

export interface SystemType {
  id: string;
  label: string;
  defaultVoltage: number;
  kFactor: number;
}

export const REVERSED_SYSTEM_TYPES: SystemType[] = [
  { id: '1P2W', label: '単相2線式', defaultVoltage: 100, kFactor: 2.0 },
  { id: '1P3W_100V', label: '単相3線式 (100V負荷)', defaultVoltage: 100, kFactor: 1.0 },
  { id: '1P3W_200V', label: '単相3線式 (200V負荷)', defaultVoltage: 200, kFactor: 2.0 },
  { id: '3P3W', label: '三相3線式 (200V)', defaultVoltage: 200, kFactor: 1.732 }
];

// モーター出力・規約電流・推奨標準力率（出力別）
export interface MotorSpec {
  kw: number;
  amp: number;
  defaultCosTheta: number;
}

export const MOTOR_SPECS: MotorSpec[] = [
  { kw: 0.2,  amp: 1.8,  defaultCosTheta: 0.80 },
  { kw: 0.4,  amp: 3.2,  defaultCosTheta: 0.80 },
  { kw: 0.75, amp: 4.8,  defaultCosTheta: 0.80 },
  { kw: 1.5,  amp: 8.0,  defaultCosTheta: 0.80 },
  { kw: 2.2,  amp: 11.1, defaultCosTheta: 0.80 },
  { kw: 3.7,  amp: 17.4, defaultCosTheta: 0.85 },
  { kw: 5.5,  amp: 26.0, defaultCosTheta: 0.85 },
  { kw: 7.5,  amp: 34.0, defaultCosTheta: 0.85 },
  { kw: 11.0, amp: 48.0, defaultCosTheta: 0.88 },
  { kw: 15.0, amp: 65.0, defaultCosTheta: 0.88 }
];

export interface CableSpec {
  size: string;
  area: number;
  r: number;
  x: number;
  baseAllowAmp: Record<CableType, number>;
}

export const CABLE_SPECS: CableSpec[] = [
  { size: '1.6mm', area: 2.01, r: 8.92, x: 0.106, baseAllowAmp: { VV: 27, IV: 27, CV: 33 } },
  { size: '2.0mm', area: 3.14, r: 5.65, x: 0.101, baseAllowAmp: { VV: 35, IV: 35, CV: 43 } },
  { size: '2.6mm', area: 5.31, r: 3.33, x: 0.095, baseAllowAmp: { VV: 48, IV: 48, CV: 59 } },
  { size: '5.5sq', area: 5.5,  r: 3.79, x: 0.101, baseAllowAmp: { VV: 49, IV: 49, CV: 61 } },
  { size: '8sq',   area: 8.0,  r: 2.31, x: 0.097, baseAllowAmp: { VV: 61, IV: 61, CV: 75 } },
  { size: '14sq',  area: 14.0, r: 1.32, x: 0.093, baseAllowAmp: { VV: 88, IV: 88, CV: 115 } },
  { size: '22sq',  area: 22.0, r: 0.84, x: 0.089, baseAllowAmp: { VV: 115, IV: 115, CV: 150 } }
];

export const REDUCTION_FACTORS: Record<InstallationType, number> = {
  conduit_3: 0.70,
  conduit_4: 0.63,
  open_air: 1.00
};

const BREAKER_SIZES = [15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200];

export interface CalculationIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  title: string;
  message: string;
}

export function useReversedCallc(
  voltage: Ref<number>,
  targetPercent: Ref<number>
) {
  const oneWayDistance = ref<number>(30);
  const selectedSystemId = ref<string>('1P2W');
  const selectedCableType = ref<CableType>('VV');
  const loadCurrent = ref<number>(15);
  const powerFactor = ref<number>(0.85);
  const loadType = ref<LoadType>('general');
  const motorKw = ref<number>(0.75);
  const installationType = ref<InstallationType>('conduit_3');
  const isContinuous = ref<boolean>(true);

  const currentSystem = computed(() => {
    return REVERSED_SYSTEM_TYPES.find((s) => s.id === selectedSystemId.value) || REVERSED_SYSTEM_TYPES[0];
  });

  const allowDropV = computed(() => {
    return voltage.value * (targetPercent.value / 100);
  });

  const currentReductionFactor = computed(() => {
    return REDUCTION_FACTORS[installationType.value] || 0.7;
  });

  const calculationIssues = computed<CalculationIssue[]>(() => {
    const issues: CalculationIssue[] = [];
    const L = oneWayDistance.value;
    const I = loadCurrent.value;

    if (!Number.isFinite(L) || L <= 0) {
      issues.push({
        level: 'error',
        code: 'INVALID_DISTANCE',
        title: 'こう長が不正です',
        message: '片道こう長は0より大きい数を入力してください。'
      });
    }

    if (!Number.isFinite(I) || I <= 0) {
      issues.push({
        level: 'error',
        code: 'INVALID_LOAD_CURRENT',
        title: '負荷電流が不正です',
        message: '定格電流は0より大きい数を入力してください。'
      });
    }

    if (loadType.value === 'motor') {
      const spec = MOTOR_SPECS.find((m) => m.kw === motorKw.value);
      const pfText = spec ? spec.defaultCosTheta.toString() : '0.85';
      issues.push({
        level: 'info',
        code: 'MOTOR_SPEC_APPLIED',
        title: '電動機（規約電流）計算を適用中',
        message: `選定: ${motorKw.value}kW (規約電流 ${I}A, 自動設定力率 cosθ=${pfText})。電線1.25倍/1.1倍則を適用して判定しています。`
      });
    }

    return issues;
  });

  const hasError = computed(() => {
    return calculationIssues.value.some((issue) => issue.level === 'error');
  });

  const availableWires = computed(() => {
    if (hasError.value) return [];

    const L = oneWayDistance.value;
    const e_allow = allowDropV.value;
    const sys = currentSystem.value;
    const cosTheta = powerFactor.value;
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));

    // 内線規程：電動機電流に応じた必要許容電流
    const requiredWireAmp = loadType.value === 'motor'
      ? (loadCurrent.value <= 50 ? loadCurrent.value * 1.25 : loadCurrent.value * 1.1)
      : loadCurrent.value;

    return CABLE_SPECS.map((spec) => {
      // 交流リアクタンスと力率を考慮した実効インピーダンス計算
      const z = spec.r * cosTheta + spec.x * sinTheta;
      const maxAmpereByDrop = z > 0 ? (e_allow * 1000) / (sys.kFactor * z * L) : 0;
      const baseAllow = spec.baseAllowAmp[selectedCableType.value];
      const allowAmpereByHeat = baseAllow * currentReductionFactor.value;
      const effectiveMaxAmp = Math.min(maxAmpereByDrop, allowAmpereByHeat);

      return {
        wireName: spec.size,
        area: spec.area,
        maxAmpereByDrop: Number(maxAmpereByDrop.toFixed(1)),
        allowAmpereByHeat: Number(allowAmpereByHeat.toFixed(1)),
        effectiveMaxAmp: Number(effectiveMaxAmp.toFixed(1)),
        isOkForLoad: effectiveMaxAmp >= loadCurrent.value && allowAmpereByHeat >= requiredWireAmp
      };
    });
  });

  const breakerStatus = computed(() => {
    if (hasError.value) return null;

    const I = loadCurrent.value;
    let requiredCapacity = I;

    if (loadType.value === 'motor') {
      requiredCapacity = I * 3.0; // モーター直入れ始動時概算倍率
    } else if (isContinuous.value) {
      requiredCapacity = I * 1.25;
    }

    const recommendedBreaker = BREAKER_SIZES.find((b) => b >= requiredCapacity) || BREAKER_SIZES[BREAKER_SIZES.length - 1];

    return {
      is20AOk: recommendedBreaker <= 20,
      currentLoad: I,
      recommendedBreaker,
      message: recommendedBreaker <= 20
        ? '⭕ 20Aブレーカー運用可能（標準コンセント回路）'
        : `⚠️ 推奨過電流遮断器容量: ${recommendedBreaker}A`
    };
  });

  return {
    oneWayDistance,
    selectedSystemId,
    selectedCableType,
    loadCurrent,
    powerFactor,
    loadType,
    motorKw,
    installationType,
    isContinuous,
    currentSystem,
    allowDropV,
    availableWires,
    breakerStatus,
    calculationIssues,
    hasError,
    REVERSED_SYSTEM_TYPES,
    MOTOR_SPECS
  };
}