<!-- CapacitorSectionCard_2.vue -->
<template>
  <div class="capacitor-card">
    <h3>推奨進相コンデンサ</h3>
    
    <!-- 推奨製品の表示 -->
    <div v-if="recommendedCapacitors.length > 0">
      <ul>
        <li v-for="cap in recommendedCapacitors" :key="cap.model">
          {{ cap.maker }} - {{ cap.model }} ({{ cap.uf.toFixed(1) }} μF / {{ cap.voltage }}V)
        </li>
      </ul>
    </div>
    <div v-else>
      <p class="text-gray-500">条件に合致する推奨製品が見つかりません。</p>
    </div>

    <!-- 候補リストトグルボタン -->
    <button 
      class="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      @click="showCandidates = !showCandidates"
    >
      {{ showCandidates ? '候補リストを閉じる' : 'DBから他の適応製品候補を表示する' }}
    </button>

    <!-- その他の適応製品候補 (±35%以内) -->
    <div v-if="showCandidates" class="candidates-list mt-4 p-4 bg-gray-50 rounded">
      <h4 class="font-bold mb-2">その他の候補 (目標の±35%以内)</h4>
      <ul v-if="candidateCapacitors.length > 0">
        <li v-for="cap in candidateCapacitors" :key="cap.model">
          {{ cap.maker }} - {{ cap.model }} ({{ cap.uf.toFixed(1) }} μF / {{ cap.voltage }}V)
        </li>
      </ul>
      <p v-else class="text-sm text-gray-500">条件に一致する候補製品がありません。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { findCandidateCapacitors, type CapacitorProduct } from '@/utils/capacitor';

const props = defineProps<{
  catalog: CapacitorProduct[]; // 親（またはuseCapacitor）から取得済みリストを受け取る
  recommendedCapacitors: CapacitorProduct[];
  voltage: number;
  hz: number;
  targetUf: number;
}>();

const showCandidates = ref(false);

// 候補リストの計算（ユーティリティ関数で統一されたロジックを使用）
const candidateCapacitors = computed(() => {
  return findCandidateCapacitors(
    props.catalog,
    props.voltage,
    props.hz,
    props.targetUf
  );
});
</script>

<style scoped>
.capacitor-card {
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #ffffff;
}
</style>