<!-- src/components/common/Notice.vue -->
<template>
  <div class="notice-cards-wrapper space-y-4">
    
    <!-- メイン結果表示カード（単体計算定格電流 / 計算一次定格電流） -->
  <!-- <div class="result-card-dark">
        <div class="main-result">
        <span class="result-label">
          {{ driveMode === 'inverter' ? '計算一次定格電流 (インバータ)' : '単体計算定格電流 (1台あたり)' }}
        </span>
        <div class="result-value-group">
          <span class="result-value">{{ calculatedAmp }}</span>
          <span class="result-unit">A</span>
        </div>
      </div>
    </div> -->

    <!-- 1. 保護遮断器 (ブレーカ) カテゴリカード -->
    <BreakerSelect :breaker-info="breakerInfo" />

    <!-- 2. 漏電遮断器 (ELCB) & 設置工事 カテゴリカード -->
    <ElbSelectionCard
      :elcb-info="elcbInfo" 
      :recommended-installation="recommendedInstallation" 
    />

    <!-- 警告・注意ノート（組み込んだ通知ボックス構造） -->
    <div v-if="breakerInfo?.warningNote" class="notice-box warning">
      <div class="notice-icon">
        <span>⚠️</span>
      </div>
      <div class="notice-content">
        <p class="notice-text">
          {{ breakerInfo.warningNote }}
        </p>
      </div>
    </div>

    <!-- 既存のサイドスライドトリガー（合算電流・力率詳細設定用ドロワー）-->
    <!-- <IrSectionCard
      v-model:isshow="isTotalAmpOpenProxy"
      :display-total-load-amp="displayTotalLoadAmp"
      :calculated-amp="calculatedAmp"
      :motor-count="motorCount"
      :other-load-amp="otherLoadAmp"
    />

    <CapacitorSectionCard
      v-model:isshow="isPowerFactorOpenProxy"
      v-model:powerFactor="powerFactorProxy"
      v-model:targetPowerFactor="targetPowerFactorProxy"
      v-model:efficiency="efficiencyProxy"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IrSectionCard from '@/components/Motor/IrSectionCard.vue';
import CapacitorSectionCard from '@/components/Motor/CapacitorSectionCard.vue';
import BreakerSelect from '@/components/Motor/BreakerSelect.vue';
import ElbSelectionCard from '@/components/Motor/ElbSelectionCard.vue';
import type { CapacitorProduct } from '@/utils/capacitor';

const props = defineProps<{
  driveMode: string | null;
  calculatedAmp: number;
  isTotalAmpOpen: boolean;
  displayTotalLoadAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  isPowerFactorOpen: boolean;
  powerFactor: number;
  targetPowerFactor: number;
  efficiency: number;
  breakerInfo: any;
  elcbInfo: any;
  recommendedInstallation: string;
  recommendedCapacitors: CapacitorProduct[];
}>();

const emit = defineEmits<{
  (e: 'update:isTotalAmpOpen', value: boolean): void;
  (e: 'update:isPowerFactorOpen', value: boolean): void;
  (e: 'update:powerFactor', value: number): void;
  (e: 'update:targetPowerFactor', value: number): void;
  (e: 'update:efficiency', value: number): void;
}>();

const isTotalAmpOpenProxy = computed({
  get: () => props.isTotalAmpOpen,
  set: (val) => emit('update:isTotalAmpOpen', val),
});

const isPowerFactorOpenProxy = computed({
  get: () => props.isPowerFactorOpen,
  set: (val) => emit('update:isPowerFactorOpen', val),
});

const powerFactorProxy = computed({
  get: () => props.powerFactor,
  set: (val) => emit('update:powerFactor', val),
});

const targetPowerFactorProxy = computed({
  get: () => props.targetPowerFactor,
  set: (val) => emit('update:targetPowerFactor', val),
});

const efficiencyProxy = computed({
  get: () => props.efficiency,
  set: (val) => emit('update:efficiency', val),
});
</script>

<style scoped>
.notice-cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
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