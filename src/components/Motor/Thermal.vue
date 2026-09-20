<!-- src/components/Motor/Thermal.vue -->
<template>
  <div class="thermal-card">
    <div class="card-header">
      <span class="icon">⚡</span>
      <h3 class="title">サーマルリレー（過負荷保護）選定</h3>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="label">推奨設定電流</span>
        <span class="value">{{ thermalInfo.settingCurrent }} A</span>
      </div>
      <div class="info-row">
        <span class="label">選定目安・調整範囲</span>
        <span class="value-sub">{{ thermalInfo.recommendedAmps }}</span>
      </div>
      <p class="description">{{ thermalInfo.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThermalSelectionResult } from '@/composables/useThermal';

defineProps<{
  thermalInfo: ThermalSelectionResult;
}>();
</script>

<style scoped>
.thermal-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  color: #f8fafc;
  margin-top: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #334155;
  padding-bottom: 8px;
}

.icon {
  font-size: 18px;
}

.title {
  font-size: 15px;
  font-weight: 700;
  color: #38bdf8;
  margin: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0f172a;
  padding: 8px 12px;
  border-radius: 8px;
}

.label {
  font-size: 13px;
  color: #94a3b8;
}

.value {
  font-size: 16px;
  font-weight: 700;
  color: #38bdf8;
}

.value-sub {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.description {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 4px 0 0 0;
}
</style>