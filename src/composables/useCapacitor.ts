// src/composables/useCapacitor.ts
import { ref, computed, type Ref } from 'vue';
import {
  type CapacitorProduct,
  calculateRequiredKvar,
  calculateTargetUf,
  findClosestCapacitorGroup,
  findCandidateCapacitors,
} from '@/base/capacitorBase';
import {
  lookupStandardCapacitor,
  type CapacitorPhase,
  type MotorClass,
  type MotorPoles,
  type StandardCapacitorResult,
} from '@/base/capacitorStandard';

/** 容量の決め方：standard = 内線規程の取付標準容量表 / calc = 力率改善の計算式 */
export type CapacitorBasis = 'standard' | 'calc';

export interface UseCapacitorOptions {
  /** 三相/単相（標準表の選択に使用）。省略時は三相 */
  phase?: Ref<CapacitorPhase>;
  /** 容量の決め方。省略時は standard */
  basis?: Ref<CapacitorBasis>;
  /** 電動機区分（三相のみ）。省略時は standard（トップランナー以外） */
  motorClass?: Ref<MotorClass>;
  /** 極数（トップランナー表のみ）。省略時は4 */
  poles?: Ref<MotorPoles>;
}

/**
 * DB APIからコンデンサカタログを取得
 */
export const fetchCapacitorCatalog = async (): Promise<CapacitorProduct[]> => {
  const res = await fetch('/api/capacitors');
  if (!res.ok) throw new Error('コンデンサデータの取得に失敗しました');
  const data = await res.json();
  return data;
};

/**
 * コンデンサ選定 Composable
 */
export function useCapacitor(
  motorKw: Ref<number | null>,
  frequency: Ref<number | null>,
  voltage: Ref<number>,
  powerFactor: Ref<number>,
  targetPowerFactor: Ref<number>,
  efficiency: Ref<number>,
  driveMode?: Ref<'direct' | 'inverter'>,
  options: UseCapacitorOptions = {}
) {
  const phase = options.phase ?? ref<CapacitorPhase>('three');
  const basis = options.basis ?? ref<CapacitorBasis>('standard');
  const motorClass = options.motorClass ?? ref<MotorClass>('standard');
  const poles = options.poles ?? ref<MotorPoles>(4);

  const capacitorCatalog = ref<CapacitorProduct[]>([]);
  const isLoading = ref<boolean>(false);

  const loadCapacitorCatalog = async () => {
    isLoading.value = true;
    try {
      capacitorCatalog.value = await fetchCapacitorCatalog();
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 力率改善の計算式による必要無効電力 (kvar)
   */
  const requiredKvar = computed(() => {
    const kw = motorKw.value;
    if (!kw || kw <= 0) return 0;
    return calculateRequiredKvar(
      kw,
      powerFactor.value || 0.85,
      targetPowerFactor.value || 0.95,
      efficiency.value || 0.85
    );
  });

  /**
   * 力率改善の計算式による目標静電容量 (μF)
   */
  const formulaUf = computed(() => {
    const kvar = requiredKvar.value;
    const f = frequency.value || 0;
    const v = voltage.value || 0;
    return calculateTargetUf(kvar, f, v);
  });

  /**
   * 内線規程の取付標準容量表による容量（該当なしは null）
   */
  const standardCapacitor = computed<StandardCapacitorResult | null>(() => {
    if (basis.value !== 'standard') return null;
    const kw = motorKw.value;
    const hz = frequency.value;
    if (!kw || kw <= 0 || (hz !== 50 && hz !== 60)) return null;
    return lookupStandardCapacitor({
      kw,
      hz,
      phase: phase.value,
      voltage: voltage.value,
      motorClass: motorClass.value,
      poles: poles.value,
    });
  });

  /**
   * 採用した容量の根拠
   *  - standard : 標準表
   *  - formula  : 力率計算（basis=calc を選択）
   *  - formula_fallback : 標準表に該当が無いため力率計算へフォールバック
   */
  const targetSource = computed<'standard' | 'formula' | 'formula_fallback'>(() => {
    if (basis.value === 'calc') return 'formula';
    return standardCapacitor.value ? 'standard' : 'formula_fallback';
  });

  /**
   * 目標静電容量 (μF)：標準表があればその値、無ければ計算式
   */
  const targetUf = computed(() =>
    standardCapacitor.value ? standardCapacitor.value.uf : formulaUf.value
  );

  /**
   * 採用容量の無効電力 (kvar)
   */
  const targetKvar = computed(() =>
    standardCapacitor.value ? standardCapacitor.value.kvar : requiredKvar.value
  );

  /**
   * 推奨コンデンサリスト
   */
  const recommendedCapacitors = computed(() => {
    if (
      !motorKw.value ||
      !frequency.value ||
      !voltage.value ||
      capacitorCatalog.value.length === 0 ||
      targetUf.value <= 0
    ) {
      return [];
    }

    return findClosestCapacitorGroup(
      capacitorCatalog.value,
      voltage.value,
      frequency.value,
      targetUf.value
    );
  });

  /**
   * その他の適応候補リスト
   */
  const candidateCapacitors = computed(() => {
    if (
      !motorKw.value ||
      !frequency.value ||
      !voltage.value ||
      capacitorCatalog.value.length === 0 ||
      targetUf.value <= 0
    ) {
      return [];
    }

    return findCandidateCapacitors(
      capacitorCatalog.value,
      voltage.value,
      frequency.value,
      targetUf.value
    );
  });

  return {
    capacitorCatalog,
    isLoading,
    requiredKvar,
    formulaUf,
    standardCapacitor,
    targetSource,
    targetUf,
    targetKvar,
    recommendedCapacitors,
    candidateCapacitors,
    loadCapacitorCatalog,
  };
}
