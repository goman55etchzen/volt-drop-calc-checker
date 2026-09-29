// composables/useCapacitor.ts
import { ref, computed, type Ref } from 'vue';
import type { CapacitorProduct } from '@/types/capacitorBase';

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
 * 電圧マッチングロジック (定格電圧に対して +10% までの上限許容)
 */
export const isVoltageMatch = (productVoltage: number, targetVoltage: number): boolean => {
  return productVoltage >= targetVoltage && productVoltage <= targetVoltage * 1.1;
};

/**
 * 目標静電容量 (μF) に最も近い製品グループ（同等品）の抽出
 */
export const findClosestCapacitorGroup = (
  catalog: CapacitorProduct[],
  targetVoltage: number,
  targetHz: number,
  targetUf: number
): CapacitorProduct[] => {
  if (!catalog.length || targetUf <= 0) return [];

  const filtered = catalog.filter((p) => 
    isVoltageMatch(p.voltage, targetVoltage) && (!p.hz || p.hz === targetHz)
  );

  if (!filtered.length) return [];

  let closest = filtered[0];
  let minDiff = Math.abs(closest.uf - targetUf);

  for (const p of filtered) {
    const diff = Math.abs(p.uf - targetUf);
    if (diff < minDiff) {
      closest = p;
      minDiff = diff;
    }
  }

  return filtered.filter((p) => p.group_id === closest.group_id);
};

/**
 * 適応製品候補の抽出 (デフォルト: 目標μFの ±35% 以内)
 */
export const findCandidateCapacitors = (
  catalog: CapacitorProduct[],
  targetVoltage: number,
  targetHz: number,
  targetUf: number,
  tolerance: number = 0.35
): CapacitorProduct[] => {
  if (!catalog.length || targetUf <= 0) return [];

  return catalog.filter((p) => {
    const voltMatch = isVoltageMatch(p.voltage, targetVoltage);
    const hzMatch = !p.hz || p.hz === targetHz;
    const diffRatio = Math.abs(p.uf - targetUf) / targetUf;
    return voltMatch && hzMatch && diffRatio <= tolerance;
  });
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
  efficiency: Ref<number>
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