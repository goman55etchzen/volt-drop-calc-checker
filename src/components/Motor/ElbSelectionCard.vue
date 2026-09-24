<!-- src/components/Motor/ElbSelectionCard.vue -->
<template>
  <div class="category-card">
    <div class="card-header">
      <h3 class="card-title">⚡ 漏電遮断器 (ELB) 選定 (内線規程3310-4)</h3>
    </div>
    <div class="card-body">
      <!-- 適合するブレーカー定格 (AF/AT) -->
      <div class="card-body-grid">
        <div class="data-block">
          <span class="data-label">基準ブレーカー容量</span>
          <span class="data-value highlight">
            {{ displayFrameAndAmp }}
          </span>
        </div>

        <div class="data-block">
          <span class="data-label">要求定格感度電流</span>
          <span class="data-value">
            {{ displaySensitivity }}
          </span>
        </div>
      </div>

      <!-- 施工推奨仕様・解説文表示（両方の情報を結合して確実に表示） -->
      <div v-if="recommendedInstallation || elcbInfo?.description" class="installation-note mt-3">
        <span class="note-label">施工推奨仕様 / 解説：</span>
        <p class="note-text">
          <span v-if="recommendedInstallation">{{ recommendedInstallation }}</span>
          <span v-if="recommendedInstallation && elcbInfo?.description"><br></span>
          <span v-if="elcbInfo?.description">{{ elcbInfo.description }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ElcbSelectionResult } from '@/types/appDefinitions';

const props = defineProps<{
  elcbInfo: ElcbSelectionResult;
  recommendedInstallation?: string;
}>();

/** 基準ブレーカー容量の表示整形 */
const displayFrameAndAmp = computed(() => {
  if (!props.elcbInfo) return '-';
  const amp = props.elcbInfo.recommendedAmp;
  return amp ? `${amp} A` : '-';
});

/** 要求定格感度電流の表示整形 */
const displaySensitivity = computed(() => {
  if (!props.elcbInfo) return '-';
  const sensitivity = props.elcbInfo.sensitivityCurrent;
  return sensitivity ? `${sensitivity} mA` : '-';
});
</script>

<style scoped>
.category-card {
  background-color: #1e293b;
  border-radius: 12px;
  padding: 16px;
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

.installation-note {
  background-color: #0f172a;
  border-left: 3px solid #38bdf8;
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
  font-size: 12px;
}

.note-label {
  color: #cbd5e1;
  font-weight: bold;
}

.note-text {
  margin: 4px 0 0 0;
  color: #94a3b8;
  white-space: pre-wrap;
  line-height: 1.45;
}

.mt-3 {
  margin-top: 12px;
}

/* PC向けレスポンシブ拡張 */
@media (min-width: 768px) {
  .category-card {
    padding: 20px;
  }
  .card-title {
    font-size: 16px;
  }
  .card-body-grid {
    gap: 16px;
  }
  .data-block {
    padding: 16px;
  }
  .data-label {
    font-size: 13px;
  }
  .data-value {
    font-size: 20px;
  }
  .installation-note {
    font-size: 13px;
    padding: 10px 14px;
  }
}
</style>