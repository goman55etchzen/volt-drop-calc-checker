<template>
  <div class="result-sticky-card" :class="{ warning: isOverCurrent }">
    <div class="sticky-inner">
      <div class="sticky-info">
        <span class="status-badge" :class="{ ok: !isOverCurrent }">
          {{ isOverCurrent ? '⚠️ 許容オーバー' : '⭕ セーフ' }}
        </span>
        <span class="sub-text">最大許容配線長</span>
      </div>
      <div class="sticky-val">
        <span class="num">{{ maxLen.toFixed(1) }}</span>
        <span class="unit">m</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ResultCardProps } from '../types/appDefinitions';

defineProps<ResultCardProps>();
</script>

<style scoped>
.result-sticky-card {
  position: sticky;
  top: 12px;
  z-index: 50;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid #0284c7;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(56, 189, 248, 0.2);
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.result-sticky-card.warning {
  background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%);
  border-color: #ef4444;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(239, 68, 68, 0.3);
}

.sticky-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sticky-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: #ef4444;
  color: #ffffff;
  width: fit-content;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.status-badge.ok {
  background: #16a34a;
}

.sub-text {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

.sticky-val {
  display: flex;
  align-items: baseline;
}

.num {
  font-size: 38px;
  font-weight: 900;
  color: #38bdf8;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
  line-height: 1;
}

.result-sticky-card.warning .num {
  color: #fca5a5;
  text-shadow: 0 0 10px rgba(252, 165, 165, 0.3);
}

.unit {
  font-size: 18px;
  font-weight: 700;
  margin-left: 4px;
  color: #f8fafc;
}
</style>