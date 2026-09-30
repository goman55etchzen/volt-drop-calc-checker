// src/composables/useCapacitor.ts
import { ref, computed, type Ref } from "vue";
import {
  type CapacitorProduct,
  calculateRequiredKvar,
  calculateTargetUf,
  findClosestCapacitorGroup,
  findCandidateCapacitors,
} from "@/base/capacitorBase";

/**
 * DB APIからコンデンサカタログを取得
 */
export const fetchCapacitorCatalog = async (): Promise<CapacitorProduct[]> => {
  const res = await fetch("/api/capacitors");
  if (!res.ok) throw new Error("コンデンサデータの取得に失敗しました");
  const data: CapacitorProduct[] = await res.json();
  return data;
};

/**
 * コンデンサ選定・管理 Composable
 */
export function useCapacitor(
  motorKw: Ref<number | null | undefined>,
  frequency: Ref<number | null | undefined>,
  voltage: Ref<number | null | undefined>,
  powerFactor: Ref<number | null | undefined>,
  targetPowerFactor: Ref<number | null | undefined>,
  efficiency: Ref<number | null | undefined>,
  driveMode?: Ref<string | undefined>
) {
  const capacitorCatalog = ref<CapacitorProduct[]>([]);
  const isLoading = ref<boolean>(false);

  const loadCapacitorCatalog = async () => {
    isLoading.value = true;
    try {
      capacitorCatalog.value = await fetchCapacitorCatalog();
    } catch (e) {
      console.error("コンデンサカタログの読み込みエラー:", e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 必要無効電力 (kvar) の算出
   */
  const requiredKvar = computed(() => {
    if (driveMode && driveMode.value === "inverter") return 0;

    const kw = motorKw.value ?? 0;
    const pf = powerFactor.value ?? 0.85;
    const tPf = targetPowerFactor.value ?? 0.95;
    const eff = efficiency.value ?? 0.85;

    return calculateRequiredKvar(kw, pf, tPf, eff);
  });

  /**
   * 目標静電容量 (μF) の算出
   */
  const targetUf = computed(() => {
    const kvar = requiredKvar.value;
    const f = frequency.value ?? 0;
    const v = voltage.value ?? 0;

    return calculateTargetUf(kvar, f, v);
  });

  /**
   * 推奨コンデンサリスト（目標静電容量に最も近いグループ）
   */
  const recommendedCapacitors = computed(() => {
    if (
      driveMode?.value === "inverter" ||
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
   * その他の適応候補リスト（目標の ±35% 以内）
   */
  const candidateCapacitors = computed(() => {
    if (
      driveMode?.value === "inverter" ||
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
      targetUf.value,
      0.35
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