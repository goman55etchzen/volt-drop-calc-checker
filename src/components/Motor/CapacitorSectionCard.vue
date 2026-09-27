<!-- src/components/Motor/CapacitorSectionCard.vue -->
<template>
  <div class="capacitor-card-container">
    <div class="card-header">
      <h4 class="card-title">⚡ 推奨進相コンデンサ（力率改善用）</h4>
      <span class="freq-tag">{{ frequency }}Hz 用</span>
    </div>

    <!-- 1. 現在選定されている推奨コンデンサ一覧 -->
    <div v-if="recommendedCapacitors && recommendedCapacitors.length > 0" class="cap-list">
      <div v-for="(cap, idx) in recommendedCapacitors" :key="idx" class="cap-item">
        <div class="cap-main-info">
          <span class="cap-mfr">{{ cap.mfr }}</span>
          <span class="cap-part">{{ cap.part_number }}</span>
        </div>
        <div class="cap-spec-info">
          <span class="cap-kvar">{{ frequency === 60 ? cap.kvar_60hz : cap.kvar_50hz }} kvar</span>
          <span class="cap-uf">{{ cap.capacity_uf }} μF</span>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      推奨コンデンサ情報がありません
    </div>

    <!-- 2. DB候補データの表示切り替えアクション -->
    <div class="candidate-toggle-section">
      <button 
        type="button" 
        class="toggle-btn"
        :class="{ active: showCandidates }"
        @click="toggleCandidates"
      >
        <span>{{ showCandidates ? '▲ 候補リストを閉じる' : '🔍 DBから他の適応製品候補を表示する' }}</span>
      </button>
    </div>

    <!-- 3. DBからの候補データ試覧（プレビュー）エリア -->
    <div v-if="showCandidates" class="candidates-preview-box">
      <div class="preview-header">
        <span class="preview-title">🗄️ データベース適合製品一覧</span>
        <span class="count-badge" v-if="candidatesList.length">{{ candidatesList.length }} 件</span>
      </div>

      <!-- ローディング中 -->
      <div v-if="isLoading" class="loading-state">
        <span class="spinner">⏳</span> DBから製品データを検索中...
      </div>

      <!-- 候補リスト一覧 -->
      <div v-else-if="candidatesList.length > 0" class="candidate-cards">
        <div 
          v-for="item in candidatesList" 
          :key="item.id" 
          class="candidate-card"
          :class="{ selected: selectedId === item.id }"
          @click="selectCandidate(item)"
        >
          <div class="candidate-top">
            <span class="mfr-badge">{{ item.mfr }}</span>
            <span class="model-name">{{ item.part_number }}</span>
          </div>

          <div class="candidate-specs">
            <div class="spec-col">
              <span class="spec-label">容量:</span>
              <span class="spec-val">{{ item.capacity_uf }} μF</span>
            </div>
            <div class="spec-col">
              <span class="spec-label">容量(kvar):</span>
              <span class="spec-val">{{ frequency === 60 ? item.kvar_60hz : item.kvar_50hz }} kvar</span>
            </div>
            <div class="spec-col" v-if="item.dimensions">
              <span class="spec-label">寸法(WxDxH):</span>
              <span class="spec-val">{{ item.dimensions.w }}×{{ item.dimensions.d }}×{{ item.dimensions.h }} mm</span>
            </div>
            <div class="spec-col" v-if="item.weight_kg">
              <span class="spec-label">質量:</span>
              <span class="spec-val">{{ item.weight_kg }} kg</span>
            </div>
          </div>

          <div class="select-action">
            <span v-if="selectedId === item.id" class="selected-tag">✓ 選択中</span>
            <span v-else class="preview-tag">タップして試覧・適用</span>
          </div>
        </div>
      </div>

      <!-- 該当なし -->
      <div v-else class="empty-state">
        条件（{{ voltage }}V / {{ targetUf }}μF 付近）に合うDB登録製品が見つかりませんでした。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CapacitorProduct } from '@/utils/capacitor';
import { fetchCapacitorCatalog } from '@/utils/capacitor';

const props = defineProps<{
  voltage: number;
  frequency: number;
  targetUf?: number;
  recommendedCapacitors: CapacitorProduct[];
}>();

const emit = defineEmits<{
  (e: 'selectCandidate', capacitor: CapacitorProduct): void;
}>();

const showCandidates = ref(false);
const isLoading = ref(false);
const candidatesList = ref<CapacitorProduct[]>([]);
const selectedId = ref<string | null>(null);

// 「候補を表示」ボタンの処理
const toggleCandidates = async () => {
  showCandidates.value = !showCandidates.value;

  if (showCandidates.value && candidatesList.value.length === 0) {
    isLoading.value = true;
    try {
      // 全カタログを取得し、電圧と目標μFに近いものをフィルタリング
      // ※将来的には Neon API (/api/capacitors) からの fetch に差し替え可能
      const allProducts = await fetchCapacitorCatalog();
      
      candidatesList.value = allProducts.filter(p => {
        const isVoltMatch = p.voltage === props.voltage;
        // 例: 目標μFの ±30% 範囲内の製品を候補として抽出
        if (!props.targetUf) return isVoltMatch;
        const diff = Math.abs(p.capacity_uf - props.targetUf);
        return isVoltMatch && (diff / props.targetUf) <= 0.35;
      });
    } catch (e) {
      console.error('DB候補取得エラー:', e);
    } finally {
      isLoading.value = false;
    }
  }
};

const selectCandidate = (item: CapacitorProduct) => {
  selectedId.value = item.id;
  emit('selectCandidate', item);
};
</script>

<style scoped>
.capacitor-card-container {
  background-color: #0f172a;
  border: 1px solid #10b981;
  border-radius: 12px;
  padding: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-title {
  font-size: 13px;
  font-weight: bold;
  color: #34d399;
  margin: 0;
}

.freq-tag {
  font-size: 10px;
  background-color: #064e3b;
  color: #6ee7b7;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.cap-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cap-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1e293b;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.cap-main-info {
  display: flex;
  flex-direction: column;
}

.cap-mfr {
  font-size: 10px;
  color: #94a3b8;
}

.cap-part {
  color: #f8fafc;
  font-weight: bold;
}

.cap-spec-info {
  display: flex;
  gap: 8px;
}

.cap-kvar {
  color: #38bdf8;
  font-weight: bold;
}

.cap-uf {
  color: #4ade80;
  font-weight: bold;
}

/* 候補切り替えボタン */
.candidate-toggle-section {
  margin-top: 12px;
  border-top: 1px dashed #334155;
  padding-top: 10px;
}

.toggle-btn {
  width: 100%;
  padding: 8px 12px;
  background: #1e293b;
  border: 1px solid #0284c7;
  border-radius: 8px;
  color: #38bdf8;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover, .toggle-btn.active {
  background: #0284c7;
  color: #ffffff;
}

/* DB候補プレビューボックス */
.candidates-preview-box {
  margin-top: 10px;
  background-color: #020617;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 10px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-title {
  font-size: 11px;
  color: #cbd5e1;
  font-weight: bold;
}

.count-badge {
  font-size: 10px;
  background: #334155;
  color: #38bdf8;
  padding: 1px 6px;
  border-radius: 10px;
}

.candidate-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.candidate-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.candidate-card:hover {
  border-color: #38bdf8;
}

.candidate-card.selected {
  border-color: #4ade80;
  background: #062016;
}

.candidate-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.mfr-badge {
  font-size: 9px;
  background: #3b82f6;
  color: #fff;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.model-name {
  font-size: 12px;
  color: #f8fafc;
  font-weight: bold;
}

.candidate-specs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  font-size: 10px;
  color: #94a3b8;
  background: #1e293b;
  padding: 6px;
  border-radius: 4px;
}

.spec-val {
  color: #e2e8f0;
  font-weight: bold;
  margin-left: 4px;
}

.select-action {
  text-align: right;
  margin-top: 4px;
}

.preview-tag {
  font-size: 10px;
  color: #38bdf8;
}

.selected-tag {
  font-size: 10px;
  color: #4ade80;
  font-weight: bold;
}

.loading-state, .empty-state {
  text-align: center;
  font-size: 11px;
  color: #64748b;
  padding: 12px;
}
</style>