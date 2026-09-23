<!-- src/components/Motor/MotorBreakerCard.vue -->
<!--
  直結（商用電源）駆動時の保護遮断器選定結果を表示する専用カード。
  Notice.vue から v-if="driveMode === 'direct'" で差し込む。
  インバータ時は MccbSelectCard.vue を使うこと。
-->
<template>
  <div class="mb-card">

    <!-- ヘッダー -->
    <div class="card-header">
      <span class="icon">🛡️</span>
      <h3 class="title">選定保護遮断器（直結）</h3>
      <!-- 種別バッジ -->
      <span :class="['type-badge', breakerInfo.selectedType === 'motor_breaker' ? 'type-badge--mb' : 'type-badge--mccb']">
        {{ breakerInfo.selectedType === 'motor_breaker' ? 'モーターブレーカー' : 'MCCB（配線用遮断器）' }}
      </span>
    </div>

    <!-- ボディ -->
    <div class="card-body">

      <!-- 推奨容量 -->
      <div class="info-row">
        <span class="label">推奨容量</span>
        <span class="value">{{ breakerInfo.recommendedAmp }} A</span>
      </div>

      <!-- 選定基準 -->
      <div class="info-row">
        <span class="label">選定基準</span>
        <span class="value-sub">
          {{
            breakerInfo.selectedType === 'motor_breaker'
              ? '定格電流基準（1台あたり）'
              : '定格電流 × 3.0 倍（始動電流考慮・内線規程3705-8）'
          }}
        </span>
      </div>

      <!-- サーマルリレー要否 -->
      <div class="info-row">
        <span class="label">サーマルリレー</span>
        <span :class="['badge', breakerInfo.requiresThermalRelay ? 'badge--required' : 'badge--not-required']">
          {{ breakerInfo.requiresThermalRelay ? '必要（MCCBと組み合わせて使用）' : '原則不要（MB内蔵保護で代替）' }}
        </span>
      </div>

      <!-- 15kW超警告 -->
      <div v-if="breakerInfo.isOver15kW" class="alert alert--warning">
        <span class="alert-icon">⚠️</span>
        <p class="alert-text">
          15 kW を超える電動機のため、モーターブレーカーは使用できません。
          上位 MCCB とサーマルリレー（電磁接触器）を必ず併用してください。
        </p>
      </div>

      <!-- warningNote（複数台・他負荷時などに付与される補足） -->
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
/* ── カード外枠（MccbSelectCard / Thermal と同一トークン） ── */
.mb-card {
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
  flex-wrap: wrap;
}
.icon { font-size: 18px; flex-shrink: 0; }
.title {
  font-size: 15px;
  font-weight: 700;
  color: #38bdf8;
  margin: 0;
  flex: 1;
  min-width: 0;
}

/* 種別バッジ（ヘッダー右端） */
.type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}
.type-badge--mb {
  background-color: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid #0284c7;
}
.type-badge--mccb {
  background-color: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border: 1px solid #475569;
}

/* ── ボディ ── */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── 情報行（MccbSelectCard / Thermal と同一） ── */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0f172a;
  padding: 8px 12px;
  border-radius: 8px;
  gap: 8px;
}
.label {
  font-size: 13px;
  color: #94a3b8;
  flex-shrink: 0;
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
  text-align: right;
}

/* ── サーマルリレー要否バッジ ── */
.badge {
  font-size: 11px;
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

/* ── 警告アラート ── */
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
.alert-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.alert-text { font-size: 12px; line-height: 1.5; margin: 0; }

/* ── 補足説明文 ── */
.description {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 4px 0 0 0;
}
</style>
