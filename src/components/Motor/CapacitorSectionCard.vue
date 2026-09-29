<!-- CapacitorSectionCard.vue -->
<template>
  <div class="capacitor-card">
    <!-- ヘッダーおよびステータス表示 -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-bold text-slate-800">推奨進相コンデンサ</h3>
      <span v-if="loading" class="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-medium">
        DB読み込み中...
      </span>
    </div>

    <!-- 1. 推奨製品の表示 -->
    <div v-if="displayRecommendedCapacitors.length > 0">
      <ul class="space-y-1.5">
        <li 
          v-for="cap in displayRecommendedCapacitors" 
          :key="cap.model" 
          class="text-sm p-2 rounded-md bg-slate-50 border border-slate-100 hover:bg-sky-50 hover:border-sky-300 cursor-pointer transition-colors flex justify-between items-center"
          @click="selectCandidate(cap)"
        >
          <div>
            <span class="font-bold text-slate-700">{{ cap.maker }}</span>
            <span class="mx-1.5 text-slate-400">|</span>
            <span class="font-mono text-slate-800">{{ cap.model }}</span>
          </div>
          <div class="text-xs font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
            {{ formatUf(cap.uf) }} μF / {{ cap.voltage }}V
          </div>
        </li>
      </ul>
    </div>
    <div v-else-if="!loading" class="p-3 bg-gray-50 rounded text-center">
      <p class="text-gray-500 text-sm">条件に合致する推奨製品が見つかりません。</p>
    </div>

    <!-- 2. 候補リストトグルボタン -->
    <button 
      type="button"
      class="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-1"
      @click="showCandidates = !showCandidates"
    >
      <span>{{ showCandidates ? '候補リストを閉じる' : 'DBから他の適応製品候補を表示する' }}</span>
      <span class="text-xs">({{ candidateCapacitors.length }}件)</span>
    </button>

    <!-- 3. その他の適応製品候補 (目標の ±35% 以内) -->
    <div v-if="showCandidates" class="candidates-list mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <h4 class="font-bold text-xs text-slate-600 mb-2.5">
        その他の候補 (目標の±35%以内 / 全 {{ candidateCapacitors.length }} 件)
      </h4>
      <ul v-if="candidateCapacitors.length > 0" class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        <li 
          v-for="cap in candidateCapacitors" 
          :key="cap.model" 
          class="text-sm p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors flex justify-between items-center"
          @click="selectCandidate(cap)"
        >
          <div>
            <span class="font-bold text-slate-700">{{ cap.maker }}</span>
            <span class="mx-1 text-slate-400">-</span>
            <span class="font-mono text-slate-800">{{ cap.model }}</span>
          </div>
          <div class="text-xs font-mono text-slate-600">
            {{ formatUf(cap.uf) }} μF / {{ cap.voltage }}V
          </div>
        </li>
      </ul>
      <p v-else class="text-xs text-slate-500 text-center py-2">条件に一致する候補製品がありません。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Neon DB API (capacitordb.ts) のレスポンスに適合したインターフェース定義
export interface CapacitorProduct {
  model: string;
  maker: string;
  uf: number;
  voltage: number;
  frequency_hz?: number;
  kvar?: number;
  group_id?: string;
}

const props = withDefaults(
  defineProps<{
    voltage?: number | string;
    hz?: number | string;
    targetUf?: number | string;
    catalog?: CapacitorProduct[];
    recommendedCapacitors?: CapacitorProduct[];
    loading?: boolean;
  }>(),
  {
    voltage: 200,
    hz: 50,
    targetUf: 0,
    catalog: () => [],
    recommendedCapacitors: () => [],
    loading: false,
  }
);

const emit = defineEmits<{
  (e: 'select-candidate', capacitor: CapacitorProduct): void;
  (e: 'selectCandidate', capacitor: CapacitorProduct): void;
}>();

const showCandidates = ref(false);

// 数値型の安全な変換ヘルパー
const numVoltage = computed(() => Number(props.voltage) || 0);
const numHz = computed(() => Number(props.hz) || 0);
const numTargetUf = computed(() => Number(props.targetUf) || 0);

// μF 表示用の安全なフォーマット
const formatUf = (uf: number | string | undefined): string => {
  const val = Number(uf);
  return isNaN(val) ? '0.0' : val.toFixed(1);
};

/**
 * 電圧マッチ判定（同一電圧 または 低圧範囲対応）
 */
const isVoltageMatch = (productVoltage: number, targetVoltage: number) => {
  return Number(productVoltage) === targetVoltage;
};

/**
 * 周波数マッチ判定（指定周波数 または 兼用/未設定）
 */
const isHzMatch = (productHz: number | undefined, targetHz: number) => {
  if (!productHz) return true; // DB上で NULL の場合は両周波数対応とみなす
  return Number(productHz) === targetHz;
};

// 1. 推奨製品リストの抽出 (計算選定結果を最優先、次点で ±15% 以内の近接製品)
const displayRecommendedCapacitors = computed(() => {
  if (props.recommendedCapacitors && props.recommendedCapacitors.length > 0) {
    return props.recommendedCapacitors;
  }
  
  if (numTargetUf.value <= 0 || !props.catalog || props.catalog.length === 0) {
    return [];
  }

  return props.catalog.filter((cap) => {
    const voltOk = isVoltageMatch(cap.voltage, numVoltage.value);
    const hzOk = isHzMatch(cap.frequency_hz, numHz.value);
    const ufDiffOk = Math.abs(Number(cap.uf) - numTargetUf.value) <= numTargetUf.value * 0.15;
    return voltOk && hzOk && ufDiffOk;
  });
});

// 2. その他の候補品リストの絞り込み (目標 μF の ±35% 以内)
const candidateCapacitors = computed(() => {
  if (numTargetUf.value <= 0 || !props.catalog || props.catalog.length === 0) {
    return [];
  }

  return props.catalog.filter((cap) => {
    const voltOk = isVoltageMatch(cap.voltage, numVoltage.value);
    const hzOk = isHzMatch(cap.frequency_hz, numHz.value);
    const diffRatio = Math.abs(Number(cap.uf) - numTargetUf.value) / numTargetUf.value;
    return voltOk && hzOk && diffRatio <= 0.35;
  });
});

// 候補選択時イベントの発行 (ケバブケース / キャメルケースの両イベントに対応)
const selectCandidate = (cap: CapacitorProduct) => {
  emit('select-candidate', cap);
  emit('selectCandidate', cap);
};
</script>

<style scoped>
.capacitor-card {
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  border-radius: 12px;
  background-color: #ffffff;
  color: #1e293b;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
</style>