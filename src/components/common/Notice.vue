<!-- src/components/common/Notice.vue -->
<template>
  <div class="notice-cards-wrapper">

    <!-- 1. メイン算出結果カード（タップで拡大） -->
    <div class="result-card-dark clickable-card" @click="openModal('result')">
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
      <div class="tap-hint">🔍 タップして拡大表示</div>
    </div>

    <!-- 2. 詳細選定結果（全条件が揃った場合のみ） -->
    <template v-if="showDetails">

      <!-- 2-1. 漏電遮断器（ELCB）（タップで拡大） -->
      <div class="clickable-card-wrapper" @click="openModal('elb')">
        <ElbSelectionCard
          :elcb-info="elcbInfo"
          :recommended-installation="recommendedInstallation"
        />
        <div class="tap-hint-bar">🔍 タップして拡大</div>
      </div>

      <!-- 2-2. 選定保護遮断器（タップで拡大） -->
      <div class="clickable-card-wrapper" @click="openModal('breaker')">
        <MotorBreakerCard
          v-if="driveMode === 'direct'"
          :breaker-info="breakerInfo"
        />
        <MccbSelectCard
          v-else-if="driveMode === 'inverter'"
          :breaker-info="breakerInfo"
        />
        <div class="tap-hint-bar">🔍 タップして拡大</div>
      </div>

      <!-- 2-3. 推奨進相コンデンサ（タップで拡大） -->
      <div 
        v-if="recommendedCapacitors && recommendedCapacitors.length > 0" 
        class="clickable-card-wrapper" 
        @click="openModal('capacitor')"
      >
        <div class="capacitor-recommend-card">
          <h4 class="cap-title">⚡ 推奨進相コンデンサ（力率改善用）</h4>
          <div class="cap-list">
            <div v-for="(cap, idx) in recommendedCapacitors" :key="idx" class="cap-item">
              <span class="cap-name">{{ cap.mfr }} ({{ cap.part_number }})</span>
              <span class="cap-spec">
                {{ frequency === 60 ? cap.kvar_60hz : cap.kvar_50hz }} kvar / {{ cap.capacity_uf }} μF
              </span>
            </div>
          </div>
        </div>
        <div class="tap-hint-bar">🔍 タップして拡大</div>
      </div>

      <!-- 2-4. サーマルリレー選定（タップで拡大） -->
      <div class="clickable-card-wrapper" @click="openModal('thermal')">
        <Thermal
          :thermal-info="thermalInfo"
          :drive-mode="driveMode"
          :breaker-selected-type="breakerInfo.selectedType"
        />
        <div class="tap-hint-bar">🔍 タップして拡大</div>
      </div>

      <!-- 2-5. 補足警告 -->
      <div
        v-if="driveMode !== 'inverter' && breakerInfo?.warningNote"
        class="notice-box warning"
      >
        <div class="notice-icon"><span>⚠️</span></div>
        <div class="notice-content">
          <p class="notice-text">{{ breakerInfo.warningNote }}</p>
        </div>
      </div>

    </template>

    <!-- =====================================================
         全画面ポップアップ拡大モーダル（比率拡大適用）
         ===================================================== -->
    <div v-if="activeModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title-text">拡大詳細ビュー</span>
          <button type="button" class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <!-- 1. メイン結果の拡大 -->
          <div v-if="activeModal === 'result'" class="result-card-dark modal-inner-card modal-scale-wrapper">
            <div class="main-result">
              <span class="result-label">
                {{ driveMode === 'inverter' ? '計算一次定格電流 (インバータ)' : '単体計算定格電流 (1台あたり)' }}
              </span>
              <div class="result-value-group">
                <span class="result-value large-num">{{ calculatedAmp || 0 }}</span>
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

          <!-- 2. ELCBの拡大 -->
          <div v-if="activeModal === 'elb'" class="modal-scale-wrapper">
            <ElbSelectionCard
              :elcb-info="elcbInfo"
              :recommended-installation="recommendedInstallation"
            />
          </div>

          <!-- 3. 保護遮断器の拡大 -->
          <template v-if="activeModal === 'breaker'">
            <div class="modal-scale-wrapper">
              <MotorBreakerCard
                v-if="driveMode === 'direct'"
                :breaker-info="breakerInfo"
              />
              <MccbSelectCard
                v-else-if="driveMode === 'inverter'"
                :breaker-info="breakerInfo"
              />
              <!-- モーダル内でも保護遮断器の直下にコンデンサを表示（既存コード維持） -->
              <div v-if="recommendedCapacitors && recommendedCapacitors.length > 0" class="capacitor-recommend-card mt-3">
                <h4 class="cap-title">⚡ 推奨進相コンデンサ（力率改善用）</h4>
                <div class="cap-list">
                  <div v-for="(cap, idx) in recommendedCapacitors" :key="idx" class="cap-item">
                    <span class="cap-name">{{ cap.mfr }} ({{ cap.part_number }})</span>
                    <span class="cap-spec">
                      {{ frequency === 60 ? cap.kvar_60hz : cap.kvar_50hz }} kvar / {{ cap.capacity_uf }} μF
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 4. サーマルリレーの拡大 -->
          <div v-if="activeModal === 'thermal'" class="modal-scale-wrapper">
            <Thermal
              :thermal-info="thermalInfo"
              :drive-mode="driveMode"
              :breaker-selected-type="breakerInfo.selectedType"
            />
          </div>

          <!-- 5. コンデンサ単体の拡大（新設） -->
          <div v-if="activeModal === 'capacitor'" class="capacitor-recommend-card modal-inner-card modal-scale-wrapper">
            <h4 class="cap-title">⚡ 推奨進相コンデンサ（力率改善用）</h4>
            <div class="cap-list">
              <div v-for="(cap, idx) in recommendedCapacitors" :key="idx" class="cap-item">
                <span class="cap-name">{{ cap.mfr }} ({{ cap.part_number }})</span>
                <span class="cap-spec">
                  {{ frequency === 60 ? cap.kvar_60hz : cap.kvar_50hz }} kvar / {{ cap.capacity_uf }} μF
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ElbSelectionCard from '@/components/Motor/ElbSelectionCard.vue';
import MotorBreakerCard from '@/components/Motor/MotorBreakerCard.vue';
import MccbSelectCard from '@/components/Motor/MccbSelectCard.vue';
import Thermal from '@/components/Motor/Thermal.vue';
import type { MotorBreakerSelectionResult, ElcbSelectionResult } from '@/types/appDefinitions';
import type { ThermalSelectionResult } from '@/composables/useThermal';
import type { CapacitorProduct } from '@/utils/capacitor';

defineProps<{
  driveMode: 'direct' | 'inverter' | null;
  calculatedAmp: number;
  displayTotalLoadAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  voltage: number;
  motorKw: number;
  frequency: number;
  showDetails: boolean;
  breakerInfo: MotorBreakerSelectionResult;
  elcbInfo: ElcbSelectionResult;
  thermalInfo: ThermalSelectionResult;
  powerFactor: number;
  targetPowerFactor: number;
  efficiency: number;
  recommendedInstallation: string;
  recommendedCapacitors: CapacitorProduct[];
}>();

const activeModal = ref<'result' | 'elb' | 'breaker' | 'thermal' | 'capacitor' | null>(null);

const openModal = (type: 'result' | 'elb' | 'breaker' | 'thermal' | 'capacitor') => {
  activeModal.value = type;
};

const closeModal = () => {
  activeModal.value = null;
};
</script>

<style scoped>
.notice-cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* ── タップ可能カードの共通スタイル ── */
.clickable-card,
.clickable-card-wrapper {
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.clickable-card:hover,
.clickable-card-wrapper:hover {
  filter: brightness(1.05);
}
.tap-hint {
  text-align: center;
  font-size: 11px;
  color: #38bdf8;
  margin-top: 10px;
  font-weight: bold;
}
.tap-hint-bar {
  text-align: right;
  font-size: 10px;
  color: #38bdf8;
  padding: 2px 8px;
  font-weight: bold;
}

/* ── メイン結果カード ── */
.result-card-dark {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 2px solid #38bdf8;
  border-radius: 16px;
  padding: 20px;
  color: #ffffff;
}
.main-result { display: flex; flex-direction: column; align-items: center; }
.result-label { font-size: 14px; color: #38bdf8; font-weight: bold; }
.result-value-group { display: flex; align-items: baseline; gap: 6px; margin-top: 8px; }
.result-value { font-size: 42px; font-weight: 800; color: #f8fafc; line-height: 1; }
.result-unit { font-size: 20px; font-weight: bold; color: #94a3b8; }
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
.sub-title { font-size: 11px; color: #cbd5e1; margin-bottom: 4px; }
.sub-value { font-size: 15px; font-weight: bold; color: #f8fafc; }

/* ── コンデンサ推奨カード ── */
.capacitor-recommend-card {
  background-color: #0f172a;
  border: 1px solid #10b981;
  border-radius: 12px;
  padding: 14px;
}
.cap-title {
  font-size: 13px;
  font-weight: bold;
  color: #34d399;
  margin: 0 0 8px 0;
}
.cap-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cap-item {
  display: flex;
  justify-content: space-between;
  background-color: #1e293b;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.cap-name { color: #f8fafc; font-weight: bold; }
.cap-spec { color: #38bdf8; font-weight: bold; }

/* ── 警告ボックス ── */
.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}
.notice-box.warning {
  background-color: rgba(217, 119, 6, 0.15);
  border: 1px solid #d97706;
  color: #fbbf24;
}
.notice-icon { font-size: 16px; flex-shrink: 0; }
.notice-content { flex-grow: 1; }
.notice-text { margin: 0; }

/* ── 拡大モーダル画面スタイル ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-content {
  background-color: #0f172a;
  border: 2px solid #38bdf8;
  border-radius: 16px;
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #334155;
  padding-bottom: 8px;
}
.modal-title-text {
  font-size: 14px;
  font-weight: bold;
  color: #38bdf8;
}
.close-btn {
  background: #334155;
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:active {
  background: #e11d48;
}
.large-num {
  font-size: 52px !important;
}
.mt-3 {
  margin-top: 12px;
}

/* ── 比率による適度な拡大用ラッパー ── */
.modal-scale-wrapper {
  transform: scale(1.08);
  transform-origin: center;
  margin: 16px 4px;
}
</style>