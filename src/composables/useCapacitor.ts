// composables/useCapacitor.ts
import { ref, computed, type Ref } from 'vue';
import {
  fetchCapacitorCatalog,
  findClosestCapacitorGroup,
  type CapacitorProduct,
} from '@/utils/capacitor';

export function useCapacitor(
  motorKw: Ref<number | null>,
  frequency: Ref<number | null>,
  voltage: Ref<number>,
  powerFactor: Ref<number>,
  targetPowerFactor: Ref<number>,
  efficiency: Ref<number>
) {
  const capacitorCatalog = ref<CapacitorProduct[]>([]);
  const isLoading = ref<boolean>(false);

  /**
   * コンデンサカタログを取得
   */
  const loadCapacitorCatalog = async () => {
    isLoading.value = true;
    try {
      capacitorCatalog.value = await fetchCapacitorCatalog();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 必要無効電力 (kvar) の算出
   */
  const requiredKvar = computed(() => {
    const P = motorKw.value;
    if (!P || P <= 0) return 0;

    const pf1 = powerFactor.value || 0.85;
    const pf2 = targetPowerFactor.value || 0.95;
    const eff = efficiency.value || 0.85;

    const acos1 = Math.acos(pf1);
    const acos2 = Math.acos(pf2);
    const kvar = (P / eff) * (Math.tan(acos1) - Math.tan(acos2));

    return kvar > 0 ? kvar : 0;
  });

  /**
   * 目標静電容量 (μF) の算出
   */
  const targetUf = computed(() => {
    const kvar = requiredKvar.value;
    const f = frequency.value;
    const V = voltage.value;

    if (kvar <= 0 || !f || !V) return 0;

    const cFarad = (kvar * 1000) / (2 * Math.PI * f * Math.pow(V, 2));
    return cFarad * 1000000;
  });

  /**
   * 条件に最も適した選定コンデンサ製品リスト
   */
  const recommendedCapacitors = computed(() => {
    if (
      !motorKw.value ||
      !frequency.value ||
      !voltage.value ||
      capacitorCatalog.value.length === 0
    ) {
      return [];
    }

    if (requiredKvar.value <= 0) return [];

    return findClosestCapacitorGroup(
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
    loadCapacitorCatalog,
  };
}