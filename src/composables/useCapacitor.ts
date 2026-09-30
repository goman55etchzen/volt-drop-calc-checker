// src/composables/useCapacitor.ts
import { ref, computed, type Ref } from 'vue';
import {
  type CapacitorProduct,
  calculateRequiredKvar,
  calculateTargetUf,
  findClosestCapacitorGroup,
  findCandidateCapacitors,
} from '@/base/capacitorBase';

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
  driveMode?: Ref<'direct' | 'inverter'>
) {
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
   * 必要無効電力 (kvar) の算出
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
   * 目標静電容量 (μF) の算出
   */
  const targetUf = computed(() => {
    const kvar = requiredKvar.value;
    const f = frequency.value || 0;
    const v = voltage.value || 0;
    return calculateTargetUf(kvar, f, v);
  });

  /**
   * 推奨コンデンサリスト
   */
  const recommendedCapacitors = computed(() => {
    if (
      !motorKw.value ||
      !frequency.value ||
      !voltage.value ||
      capacitorCatalog.value.length === 0 ||
      requiredKvar.value <= 0
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
    targetUf,
    recommendedCapacitors,
    candidateCapacitors,
    loadCapacitorCatalog,
  };
}