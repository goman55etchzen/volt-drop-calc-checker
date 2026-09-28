<!-- src/components/Motor/CapacitorSectionCard.vue -->
<template>
  <div class="capacitor-card">
    <h3 class="card-title">推奨進相コンデンサ</h3>

    <!-- 推奨製品の表示 -->
    <div v-if="recommendedCapacitors.length > 0" class="recommended-list">
      <ul class="item-list">
        <li v-for="cap in recommendedCapacitors" :key="cap.model" class="item-row">
          <span class="maker-model">{{ cap.maker }} - {{ cap.model }}</span>
          <span class="spec">({{ cap.uf.toFixed(1) }} μF / {{ cap.voltage }}V)</span>
        </li>
      </ul>
    </div>
    <div v-else class="empty-msg">
      <p>条件に合致する推奨製品が見つかりません。</p>
    </div>

    <!-- 候補リストトグルボタン -->
    <button
      type="button"
      class="toggle-btn"
      @click="showCandidates = !showCandidates"
    >
      {{ showCandidates ? '候補リストを閉じる' : 'DBから他の適応製品候補を表示する' }}
    </button>

    <!-- その他の適応製品候補 (±35%以内) -->
    <div v-if="showCandidates" class="candidates-list">
      <h4 class="candidates-title">その他の候補 (目標の±35%以内)</h4>
      <ul v-if="candidateCapacitors.length > 0" class="item-list">
        <li
          v-for="cap in candidateCapacitors"
          :key="cap.model"
          class="item-row clickable"
          @click="selectCandidate(cap)"
        >
          <span class="maker-model">{{ cap.maker }} - {{ cap.model }}</span>
          <span class="spec">({{ cap.uf.toFixed(1) }} μF / {{ cap.voltage }}V)</span>
        </li>
      </ul>
      <p v-else class="empty-msg-sm">条件に一致する候補製品がありません。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { findCandidateCapacitors, type CapacitorProduct } from '@/utils/capacitor';

const props = defineProps<{
  catalog: CapacitorProduct[];
  recommendedCapacitors: CapacitorProduct[];
  voltage: number;
  hz: number;
  targetUf: number;
}>();

const emit = defineEmits<{
  (e: 'select-candidate', capacitor: CapacitorProduct): void;
}>();

const showCandidates = ref(false);

const candidateCapacitors = computed(() => {
  return findCandidateCapacitors(
    props.catalog,
    props.voltage,
    props.hz,
    props.targetUf
  );
});

const selectCandidate = (cap: CapacitorProduct) => {
  emit('select-candidate', cap);
};
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