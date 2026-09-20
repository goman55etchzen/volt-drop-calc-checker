<!-- src/components/common/Notice.vue -->
<template>
  <div class="notice-cards-wrapper">
    <!-- 1. メイン算出結果カード -->
    <div class="result-card-dark">
      <div class="main-result">
        <span class="result-label">
          {{ driveMode === 'inverter' ? '計算一次定格電流 (インバータ)' : '単体計算定格電流 (1台あたり)' }}
        </span>
        <div class="result-value-group">
          <span class="result-value">{{ calculatedAmp || 0 }}</span>
          <span class="result-unit">A</span>
        </div>
      </div>

      <div class="sub-results">
        <div class="sub-item">
          <span class="sub-title">電圧 / 出力</span>
          <span class="sub-value">{{ voltage }}V / {{ motorKw }}kW</span>
        </div>
        <div class="sub-item">
          <span class="sub-title">台数</span>
          <span class="sub-value">{{ motorCount }} 台</span>
        </div>
      </div>
    </div>

    <!-- 2. 詳細選定結果は全条件が揃った場合だけ表示 -->
    <template v-if="showDetails">
      <!-- <BreakerSelect :breaker-info="breakerInfo" /> -->

      <ElbSelectionCard
        :elcb-info="elcbInfo"
        :recommended-installation="recommendedInstallation"
      />

      <Thermal :thermal-info="thermalInfo" />

      <div v-if="breakerInfo?.warningNote" class="notice-box warning">
        <div class="notice-icon">
          <span>⚠️</span>
        </div>
        <div class="notice-content">
          <p class="notice-text">{{ breakerInfo.warningNote }}</p>
        </div>
      </div>

      <div v-if="driveMode === 'inverter'" class="notice-box warning">
        <div class="notice-icon">
          <span>⚠️</span>
        </div>
        <div class="notice-content">
          <p class="notice-text">
            インバータ一次側遮断器です。始動電流が抑制されるため商用直結（3倍則）より容量が小さくなります。
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import BreakerSelect from '@/components/Motor/BreakerSelect.vue';
import Thermal from '@/components/Motor/Thermal.vue';
import type { ThermalSelectionResult } from '@/composables/useThermal';
import ElbSelectionCard from '@/components/Motor/ElbSelectionCard.vue';
import type { CapacitorProduct } from '@/utils/capacitor';

const props = defineProps<{
  driveMode: string | null;
  calculatedAmp: number;
  displayTotalLoadAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  voltage: number;
  motorKw: number;
  showDetails: boolean;
  thermalInfo: ThermalSelectionResult;
  powerFactor: number;
  targetPowerFactor: number;
  efficiency: number;
  breakerInfo: any;
  elcbInfo: any;
  recommendedInstallation: string;
  recommendedCapacitors: CapacitorProduct[];
}>();

</script>

<style scoped>
.notice-cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* メイン結果表示用スタイル */
.result-card-dark {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 2px solid #38bdf8;
  border-radius: 16px;
  padding: 20px;
  color: #ffffff;
}
.main-result {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.result-label {
  font-size: 14px;
  color: #38bdf8;
  font-weight: bold;
}
.result-value-group {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
}
.result-value {
  font-size: 42px;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1;
}
.result-unit {
  font-size: 20px;
  font-weight: bold;
  color: #94a3b8;
}
 .sub-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 16px;
  text-align: center;
}
.sub-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #0f172a;
  padding: 12px 8px;
  border-radius: 8px;
}
.sub-title {
  font-size: 11px;
  color: #cbd5e1;
  margin-bottom: 4px;
}
.sub-value {
  font-size: 15px;
  font-weight: bold;
  color: #f8fafc;
}

/* 組み込んだ通知・警告ボックススタイル */
.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
  margin-top: 12px;
}

.notice-box.info {
  background-color: rgba(2, 132, 199, 0.15);
  border: 1px solid #0284c7;
  color: #38bdf8;
}

.notice-box.warning {
  background-color: rgba(217, 119, 6, 0.15);
  border: 1px solid #d97706;
  color: #fbbf24;
}

.notice-box.success {
  background-color: rgba(16, 185, 129, 0.15);
  border: 1px solid #10b981;
  color: #34d399;
}

.notice-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.notice-content {
  flex-grow: 1;
}

.notice-text {
  margin: 0;
}
</style>