<!-- src/components/Motor/CapacitorSectionCard.vue -->
<template>
  <div class="capacitor-card">
    <h3 class="card-title">推奨進相コンデンサ</h3>

    <!-- ローディング表示 -->
    <div v-if="loading" class="loading-state">
      <span>データを読み込み中...</span>
    </div>

    <template v-else>
      <!-- 推奨製品の表示 -->
      <div v-if="displayRecommendedCapacitors.length > 0" class="recommended-list">
        <ul class="item-list">
          <li
            v-for="cap in displayRecommendedCapacitors"
            :key="cap.model || cap.part_number || cap.id"
            class="item-row"
          >
            <span class="maker-model">{{ cap.maker || cap.mfr }} - {{ cap.model || cap.part_number }}</span>
            <span class="spec"
              >({{ (cap.uf ?? cap.capacity_uf ?? 0).toFixed(1) }} μF / {{ cap.voltage }}V)</span
            >
          </li>
        </ul>
      </div>

      <!-- 推奨容量自体はあるが、一致する型番がDBに存在しない場合 -->
      <div v-else-if="displayTargetUf !== null" class="empty-msg">
        <p>
          推奨基準容量: <strong>{{ displayTargetUf }} μF</strong>
        </p>
        <p class="sub-text">（※DB内に完全一致する型番が登録されていません）</p>
      </div>

      <!-- 条件に合致するルールがない場合 -->
      <div v-else class="empty-msg">
        <p>条件に合致する推奨製品が見つかりません。</p>
      </div>

      <!-- 候補リストトグルボタン -->
      <button type="button" class="toggle-btn" @click="handleToggleCandidates">
        {{
          showCandidates
            ? "候補リストを閉じる"
            : "DBから他の適応製品候補を表示する"
        }}
      </button>

      <!-- その他の適応製品候補 (目標の±35%以内) -->
      <div v-if="showCandidates" class="candidates-list">
        <h4 class="candidates-title">
          その他の候補 (推奨 {{ displayTargetUf ?? "基準" }} μF の ±35% 以内)
        </h4>

        <div v-if="candidatesLoading" class="loading-state-sm">
          候補データを取得中...
        </div>

        <ul v-else-if="candidateCapacitors.length > 0" class="item-list">
          <li
            v-for="cap in candidateCapacitors"
            :key="cap.model || cap.part_number || cap.id"
            class="item-row clickable"
            @click="selectCandidate(cap)"
          >
            <span class="maker-model">{{ cap.maker || cap.mfr }} - {{ cap.model || cap.part_number }}</span>
            <span class="spec"
              >({{ (cap.uf ?? cap.capacity_uf ?? 0).toFixed(1) }} μF / {{ cap.voltage }}V)</span
            >
          </li>
        </ul>
        <p v-else class="empty-msg-sm">条件に一致する候補製品がありません。</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  type CapacitorProduct,
  type CapacitorApiResponse,
  mapDbProductToUi,
} from "@/types/capacitorMaster";

// Props の定義 (親コンポーネントからのモータ条件受取)
const props = withDefaults(
  defineProps<{
    voltage?: number;
    poles?: number;
    frequency?: number;
    outputKw?: number;
    motorType?: string;
    catalog?: CapacitorProduct[];
    recommendedCapacitors?: CapacitorProduct[];
    targetUf?: number | null;
    hz?: number;
  }>(),
  {
    voltage: 200,
    poles: 4,
    frequency: 50,
    outputKw: 3.7,
    motorType: "standard",
    targetUf: null,
  },
);

const emit = defineEmits<{
  (e: "select-candidate", capacitor: CapacitorProduct): void;
}>();

// ステート定義（Propsとの命名重複を避けるためPrefixを追加）
const loading = ref(false);
const candidatesLoading = ref(false);
const showCandidates = ref(false);

const apiTargetUf = ref<number | null>(null);
const apiRecommendedCapacitors = ref<CapacitorProduct[]>([]);
const allCatalog = ref<CapacitorProduct[]>(props.catalog ?? []);

// Propsからの値とAPIからの取得値を安全にフォールバック表示
const displayTargetUf = computed<number | null>(() => {
  return apiTargetUf.value ?? props.targetUf ?? null;
});

const displayRecommendedCapacitors = computed<CapacitorProduct[]>(() => {
  if (apiRecommendedCapacitors.value.length > 0) {
    return apiRecommendedCapacitors.value;
  }
  return props.recommendedCapacitors ?? [];
});

// ① APIからの推奨コンデンサ取得
const fetchRecommendation = async () => {
  loading.value = true;
  showCandidates.value = false;
  try {
    const currentHz = props.frequency || props.hz || 50;
    const params = new URLSearchParams({
      voltage: String(props.voltage),
      poles: String(props.poles),
      frequency: String(currentHz),
      output_kw: String(props.outputKw),
      motor_type: props.motorType,
    });

    // 接続するAPIエンドポイント (capacitorDb)
    const res = await fetch(`/api/capacitorDb?${params.toString()}`);
    if (!res.ok) throw new Error("推奨データの取得に失敗しました");

    const data: CapacitorApiResponse = await res.json();

    apiTargetUf.value = data.target_capacity_uf ?? null;
    apiRecommendedCapacitors.value = (data.products || []).map(mapDbProductToUi);
  } catch (err) {
    console.error("fetchRecommendation error:", err);
    apiTargetUf.value = null;
    apiRecommendedCapacitors.value = [];
  } finally {
    loading.value = false;
  }
};

// ② DBからの全件（候補参照用）取得
const fetchAllCatalog = async () => {
  if (allCatalog.value.length > 0) return;

  candidatesLoading.value = true;
  try {
    const res = await fetch("/api/capacitorDb");
    if (!res.ok) throw new Error("全件データの取得に失敗しました");

    const data: CapacitorApiResponse = await res.json();
    allCatalog.value = (data.products || []).map(mapDbProductToUi);
  } catch (err) {
    console.error("fetchAllCatalog error:", err);
  } finally {
    candidatesLoading.value = false;
  }
};

// ③ ±35% 以内の候補フィルター計算
const candidateCapacitors = computed(() => {
  const target = displayTargetUf.value;
  if (!target || target <= 0 || allCatalog.value.length === 0) return [];

  const minUf = target * 0.65; // -35%
  const maxUf = target * 1.35; // +35%

  return allCatalog.value.filter((item) => {
    const curUf = item.uf ?? item.capacity_uf;
    return (
      item.voltage === props.voltage && curUf >= minUf && curUf <= maxUf
    );
  });
});

// 候補ボタン押下処理
const handleToggleCandidates = async () => {
  showCandidates.value = !showCandidates.value;
  if (showCandidates.value) {
    await fetchAllCatalog();
  }
};

const selectCandidate = (cap: CapacitorProduct) => {
  emit("select-candidate", cap);
};

// モータ条件の変化を監視して即時再計算
watch(
  () => [
    props.voltage,
    props.poles,
    props.frequency,
    props.hz,
    props.outputKw,
    props.motorType,
  ],
  () => {
    fetchRecommendation();
  },
  { immediate: true },
);
</script>

<style scoped>
.capacitor-card {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  color: #f8fafc;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #38bdf8;
  margin-top: 0;
  margin-bottom: 12px;
}

.loading-state,
.loading-state-sm {
  color: #94a3b8;
  font-size: 13px;
  padding: 12px 0;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #1e293b;
  border-radius: 6px;
  font-size: 14px;
  color: #f8fafc;
}

.item-row.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.item-row.clickable:hover {
  background-color: #334155;
}

.maker-model {
  font-weight: 600;
}

.spec {
  font-size: 13px;
  color: #94a3b8;
}

.empty-msg {
  color: #cbd5e1;
  font-size: 14px;
  margin-bottom: 12px;
}

.sub-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.empty-msg-sm {
  color: #cbd5e1;
  font-size: 13px;
  margin: 0;
}

.toggle-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle-btn:hover {
  background-color: #0369a1;
}

.candidates-list {
  margin-top: 16px;
  padding: 16px;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
}

.candidates-title {
  font-size: 14px;
  font-weight: bold;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 12px;
}
</style>