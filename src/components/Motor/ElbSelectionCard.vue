<!-- src/components/ElbSelectionCard.vue -->
<template>
  <div class="category-card">
    <div class="card-header">
      <h3 class="card-title">漏電遮断器 (ELB) 選定 (内線規程3310-4)</h3>
    </div>
    <div class="card-body">
      <!-- 適合するブレーカー定格 (AF/AT) -->
      <div class="card-body-grid">
        <div class="data-block">
          <span class="data-label">基準ブレーカー容量</span>
          <span class="data-value highlight">
            {{ elbResult.breakerFrameAndAmp }}
            <span class="unit"></span>
          </span>
        </div>

        <div class="data-block">
          <span class="data-label">要求定格感度電流</span>
          <span class="data-value">
            {{ elbResult.sensitivity }}
            <span class="unit"></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ElbResult {
  breakerFrameAndAmp: string;
  sensitivity: string;
}

defineProps<{
  elbResult: ElbResult;
}>();
</script>

<style scoped>
.category-card {
  background-color: #1e293b;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #334155;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-header {
  border-bottom: 1px solid #334155;
  padding-bottom: 10px;
  margin-bottom: 16px;
}

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: bold;
  color: #38bdf8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-body-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.data-block {
  background-color: #0f172a;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #334155;
  display: flex;
  flex-direction: column;
}

.data-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
  font-weight: 600;
}

.data-value {
  font-size: 16px;
  font-weight: 900;
  color: #f8fafc;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.data-value.highlight {
  color: #4ade80;
}

.unit {
  font-size: 12px;
  font-weight: normal;
  color: #94a3b8;
}

/* PC向けレスポンシブ拡張 */
@media (min-width: 768px) {
  .category-card {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  .category-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border-color: #475569;
  }
  .card-body-grid {
    gap: 16px;
  }
  .data-block {
    padding: 16px;
  }
  .data-value {
    font-size: 20px;
  }
}
</style>