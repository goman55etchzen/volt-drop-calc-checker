<template>
  <div class="capacitor-card">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-bold">推奨進相コンデンサ</h3>
      <!-- 読み込みステータス -->
      <span v-if="loading" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
        DB読み込み中...
      </span>
    </div>

    <!-- 推奨製品の表示 -->
    <div v-if="displayRecommendedCapacitors.length > 0">
      <ul class="space-y-1">
        <li 
          v-for="cap in displayRecommendedCapacitors" 
          :key="cap.model" 
          class="text-sm cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
          @click="selectCandidate(cap)"
        >
          <span class="font-semibold">{{ cap.maker }}</span> - {{ cap.model }} 
          ({{ Number(cap.uf).toFixed(1) }} μF / {{ cap.voltage }}V)
        </li>
      </ul>
    </div>
    <div v-else-if="!loading">
      <p class="text-gray-500 text-sm">条件に合致する推奨製品が見つかりません。</p>
    </div>

    <!-- 候補リストトグルボタン -->
    <button 
      type="button"
      class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
      @click="showCandidates = !showCandidates"
    >
      {{ showCandidates ? '候補リストを閉じる' : 'DBから他の適応製品候補を表示する' }}
    </button>

    <!-- その他の適応製品候補 (±35%以内) -->
    <div v-if="showCandidates" class="candidates-list mt-4 p-4 bg-gray-50 rounded">
      <h4 class="font-bold text-sm mb-2">
        その他の候補 (目標の±35%以内 / 全 {{ candidateCapacitors.length }} 件)
      </h4>
      <ul v-if="candidateCapacitors.length > 0" class="space-y-1 max-h-48 overflow-y-auto">
        <li 
          v-for="cap in candidateCapacitors" 
          :key="cap.model" 
          class="text-sm border-b border-gray-200 pb-1 cursor-pointer hover:bg-slate-200 p-1 rounded transition-colors"
          @click="selectCandidate(cap)"
        >
          {{ cap.maker }} - {{ cap.model }} ({{ Number(cap.uf).toFixed(1) }} μF / {{ cap.voltage }}V)
        </li>
      </ul>
      <p v-else class="text-sm text-gray-500">条件に一致する候補製品がありません。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

export interface CapacitorProduct {
  model: string;
  maker: string;
  uf: number;
  voltage: number;
  frequency_hz?: number;
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

// 数値型へ安全に変換するヘルパー
const numVoltage = computed(() => Number(props.voltage) || 0);
const numTargetUf = computed(() => Number(props.targetUf) || 0);

// 1. 推奨製品の表示判定
const displayRecommendedCapacitors = computed(() => {
  // 親（MotorCalc/Notice）で選定済みの推奨配列があれば最優先
  if (props.recommendedCapacitors && props.recommendedCapacitors.length > 0) {
    return props.recommendedCapacitors;
  }
  
  if (numTargetUf.value === 0 || !props.catalog || props.catalog.length === 0) {
    return [];
  }

  // 電圧の一致（型変換考慮）かつ uF の差が ±15% 以内
  return props.catalog.filter((cap) => {
    const isVoltageMatch = Number(cap.voltage) === numVoltage.value;
    const isUfClose = Math.abs(Number(cap.uf) - numTargetUf.value) <= numTargetUf.value * 0.15;
    return isVoltageMatch && isUfClose;
  });
});

// 2. その他の適応候補の絞り込み（目標の ±35% 以内）
const candidateCapacitors = computed(() => {
  if (numTargetUf.value === 0 || !props.catalog || props.catalog.length === 0) {
    return [];
  }

  return props.catalog.filter((cap) => {
    const isVoltageMatch = Number(cap.voltage) === numVoltage.value;
    const diffRatio = Math.abs(Number(cap.uf) - numTargetUf.value) / numTargetUf.value;
    return isVoltageMatch && diffRatio <= 0.35;
  });
});

const selectCandidate = (cap: CapacitorProduct) => {
  emit('select-candidate', cap);
  emit('selectCandidate', cap);
};
</script>

<style scoped>
.capacitor-card {
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #ffffff;
  color: #1e293b;
}
</style>