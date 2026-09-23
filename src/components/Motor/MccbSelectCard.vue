<!-- src/components/Motor/MccbSelectCard.vue -->
<template>
  <div class="mccb-card">
    <div class="card-header">
      <span class="icon">🔌</span>
      <h3 class="title">選定 MCCB（配線用遮断器）</h3>
    </div>

    <div class="card-body">
      <!-- 推奨容量 -->
      <div class="info-row">
        <span class="label">推奨 MCCB 容量</span>
        <span class="value">{{ breakerInfo.recommendedAmp }} A</span>
      </div>

      <!-- 選定根拠 -->
      <div class="info-row">
        <span class="label">選定基準</span>
        <span class="value-sub">定格電流 × 1.4 倍（インバータ一次側）</span>
      </div>

      <!-- サーマルリレー要否 -->
      <div class="info-row">
        <span class="label">サーマルリレー</span>
        <span :class="['badge', breakerInfo.requiresThermalRelay ? 'badge--required' : 'badge--not-required']">
          {{ breakerInfo.requiresThermalRelay ? '必要' : '不要（インバータ電子サーマルで代替）' }}
        </span>
      </div>

      <!-- 15kW超警告 -->
      <div v-if="breakerInfo.isOver15kW" class="alert alert--warning">
        <span class="alert-icon">⚠️</span>
        <p class="alert-text">15 kW を超える電動機のため、上位 MCCB とサーマルリレーの併用が必要です。</p>
      </div>

      <!-- warningNote（インバータ一次側説明など） -->
      <p v-if="breakerInfo.warningNote" class="description">
        {{ breakerInfo.warningNote }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MotorBreakerSelectionResult } from '@/types/appDefinitions';

defineProps<{
  breakerInfo: MotorBreakerSelectionResult;
}>();
</script>

<style scoped>
/* ── カード外枠 ── Thermal.vue と同一トークン */
.mccb-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  color: #f8fafc;
}

/* ── ヘッダー ── */
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

/* ── ボディ ── */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── 情報行 ── Thermal.vue と同一 */
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

/* ── バッジ（サーマルリレー要否） ── */
.badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
}

.badge--required {
  background-color: rgba(234, 179, 8, 0.15);
  color: #fbbf24;
  border: 1px solid #d97706;
}

.badge--not-required {
  background-color: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid #10b981;
}

/* ── インライン警告 ── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
}

.alert--warning {
  background-color: rgba(217, 119, 6, 0.15);
  border: 1px solid #d97706;
  color: #fbbf24;
}

.alert-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-text {
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

/* ── 説明文 ── Thermal.vue と同一 */
.description {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 4px 0 0 0;
}
</style>
