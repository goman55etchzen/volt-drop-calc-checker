<template>
  <div class="reversed-result-container">
    <!-- エラー・警告・情報メッセージ表示 -->
    <div v-if="calculationIssues.length" class="issues-card">
      <h3 class="issues-title">計算上の問題点・注意事項</h3>
      <div
        v-for="issue in calculationIssues"
        :key="issue.code"
        class="issue-item"
        :class="`issue--${issue.level}`"
      >
        <div class="issue-header">
          <span class="issue-icon">
            {{ issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : 'ℹ️' }}
          </span>
          <span class="issue-label">{{ issue.title }}</span>
        </div>
        <p class="issue-msg">{{ issue.message }}</p>
      </div>
    </div>

    <!-- 正常計算結果エリア -->
    <div v-if="!hasError" class="result-section">
      <!-- 最適推奨電線の見出しカード -->
      <div v-if="recommendedWire" class="recommend-card">
        <div class="recommend-badge">推奨選定電線</div>
        <div class="recommend-main">
          <span class="recommend-size">{{ recommendedWire.wireName }}</span>
          <span class="recommend-type">（{{ currentCableType.name }}）</span>
        </div>
        <div class="recommend-details">
          <span>降下限界: <strong>{{ recommendedWire.maxAmpereByDrop }} A</strong></span>
          <span>許容電流: <strong>{{ recommendedWire.allowAmpereByHeat }} A</strong></span>
        </div>
      </div>

      <div v-if="breakerStatus" class="result-card">
        <h4 class="card-title">送る側ブレーカー判定 (算出負荷: {{ calculatedLoadCurrent }} A)</h4>
        <p class="status-msg" :class="{ 'msg-warn': !breakerStatus.is20AOk }">
          {{ breakerStatus.message }}
        </p>
      </div>

      <!-- 選定可能電線・サイズ一覧（カード型リスト構造） -->
      <div class="wire-table-card">
        <h4 class="card-title">選定可能電線・サイズ一覧</h4>

        <div class="wire-list">
          <!-- 1.6mm / 2.0sq 以上の標準表示カード -->
          <div
            v-for="w in mainAvailableWires"
            :key="w.wireName"
            class="wire-item"
            :class="{ 'is-ok': w.isOkForLoad, 'is-recommended': w.isRecommended }"
          >
            <div class="wire-item-header">
              <div class="wire-title">
                <span class="wire-name">{{ w.wireName }}</span>
                <span v-if="w.isRecommended" class="rec-tag">推奨</span>
              </div>
              <span class="badge" :class="w.isOkForLoad ? 'badge-ok' : 'badge-ng'">
                {{ w.isOkForLoad ? '⭕ 適合' : '❌ 不可' }}
              </span>
            </div>

            <div class="wire-item-body">
              <div class="stat-box">
                <span class="stat-label">電圧降下限界</span>
                <span class="stat-value">{{ w.maxAmpereByDrop }} A</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">耐熱許容電流</span>
                <span class="stat-value">{{ w.allowAmpereByHeat }} A</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">制限要因</span>
                <span class="limiter-text" :class="`limiter--${w.limiter}`">
                  {{ w.limiter === 'drop' ? '電圧降下支配' : '許容電流支配' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 1.25sq 以下の細線アコーディオン -->
          <details v-if="smallAvailableWires.length" class="small-wire-accordion">
            <summary class="accordion-summary">
              細線サイズ（1.25sq 以下）を表示する ({{ smallAvailableWires.length }}件)
            </summary>
            <div class="accordion-content">
              <div
                v-for="w in smallAvailableWires"
                :key="w.wireName"
                class="wire-item inner-item"
                :class="{ 'is-ok': w.isOkForLoad, 'is-recommended': w.isRecommended }"
              >
                <div class="wire-item-header">
                  <div class="wire-title">
                    <span class="wire-name">{{ w.wireName }}</span>
                    <span v-if="w.isRecommended" class="rec-tag">推奨</span>
                  </div>
                  <span class="badge" :class="w.isOkForLoad ? 'badge-ok' : 'badge-ng'">
                    {{ w.isOkForLoad ? '⭕ 適合' : '❌ 不可' }}
                  </span>
                </div>

                <div class="wire-item-body">
                  <div class="stat-box">
                    <span class="stat-label">電圧降下限界</span>
                    <span class="stat-value">{{ w.maxAmpereByDrop }} A</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-label">耐熱許容電流</span>
                    <span class="stat-value">{{ w.allowAmpereByHeat }} A</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-label">制限要因</span>
                    <span class="limiter-text" :class="`limiter--${w.limiter}`">
                      {{ w.limiter === 'drop' ? '電圧降下支配' : '許容電流支配' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>

    <div v-else class="blocked-card">
      <p class="blocked-msg">
        ⚠️ 入力不整合・重大なエラーのため判定を中断しています。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRefs, computed } from 'vue'
import {
  CalculationInputMode,
  CableTypeCode,
  LoadType,
  InstallationType
} from '@/types/appDefinitions'
import { useReversedCallc } from '@/composables/useReversedCallc'

interface Props {
  voltage: number
  targetPercent: number
  inputMode: CalculationInputMode
  loadWatt: number
  loadCurrent: number
  oneWayDistance: number
  selectedSystemId: string
  selectedCableType: CableTypeCode
  powerFactor: number
  ignorePowerFactor: boolean
  loadType: LoadType
  motorKw: number
  installationType: InstallationType
  isContinuous: boolean
  ambientTemp?: number
  wireCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  ambientTemp: 30,
  wireCount: 3
})

const {
  voltage,
  targetPercent,
  inputMode,
  loadWatt,
  loadCurrent,
  oneWayDistance,
  selectedSystemId,
  selectedCableType,
  powerFactor,
  ignorePowerFactor,
  loadType,
  motorKw,
  installationType,
  isContinuous,
  ambientTemp,
  wireCount
} = toRefs(props)

const {
  calculatedLoadCurrent,
  currentCableType,
  calculationIssues,
  hasError,
  availableWires,
  recommendedWire,
  breakerStatus
} = useReversedCallc(
  voltage,
  targetPercent,
  inputMode,
  loadWatt,
  loadCurrent,
  oneWayDistance,
  selectedSystemId,
  selectedCableType,
  powerFactor,
  ignorePowerFactor,
  loadType,
  motorKw,
  installationType,
  isContinuous,
  ambientTemp,
  wireCount
)

const isSmallWire = (area: number): boolean => area <= 1.25

const mainAvailableWires = computed(() => {
  return availableWires.value.filter((w) => !isSmallWire(w.area))
})

const smallAvailableWires = computed(() => {
  return availableWires.value.filter((w) => isSmallWire(w.area))
})
</script>

<style scoped>
.reversed-result-container {
  margin-top: 16px;
}

/* 推奨電線カード */
.recommend-card {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid #38bdf8;
  border-radius: 14px;
  padding: 14px 16px;
  color: #ffffff;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.recommend-badge {
  font-size: 11px;
  font-weight: bold;
  background-color: #f59e0b;
  color: #000;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  margin-bottom: 6px;
}

.recommend-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.recommend-size {
  font-size: 26px;
  font-weight: 900;
}

.recommend-type {
  font-size: 13px;
  opacity: 0.9;
}

.recommend-details {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #e0f2fe;
}

/* 計算上の問題点カード */
.issues-card {
  background-color: #0f172a;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid #334155;
}

.issues-title {
  font-size: 14px;
  font-weight: bold;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 10px;
}

.issue-item {
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.issue--error {
  background-color: #450a0a;
  border: 1px solid #ef4444;
  color: #fca5a5;
}

.issue--warning {
  background-color: #422006;
  border: 1px solid #f59e0b;
  color: #fde68a;
}

.issue--info {
  background-color: #0c4a6e;
  border: 1px solid #38bdf8;
  color: #bae6fd;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
}

.issue-msg {
  margin: 4px 0 0 0;
  font-size: 12px;
  line-height: 1.4;
}

/* ブレーカー判定・全般カード */
.result-card,
.wire-table-card {
  background-color: #1e293b;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid #334155;
}

.card-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #f8fafc;
}

.status-msg {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
  color: #4ade80;
  line-height: 1.4;
}

.status-msg.msg-warn {
  color: #f87171;
}

/* カード型リスト表示スタイル */
.wire-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wire-item {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px;
  box-sizing: border-box;
}

.wire-item.is-recommended {
  border-color: #38bdf8;
  background-color: rgba(2, 132, 199, 0.15);
}

.wire-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e293b;
}

.wire-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wire-name {
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
}

.rec-tag {
  background-color: #0284c7;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

.wire-item-body {
  display: grid;
  grid-template-columns: 1fr 1fr 1.1fr;
  gap: 8px;
  align-items: center;
}

.stat-box {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
  white-space: nowrap;
}

.stat-value {
  font-size: 13px;
  font-weight: bold;
  color: #e2e8f0;
  white-space: nowrap;
}

.limiter-text {
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.limiter--drop {
  color: #38bdf8;
}

.limiter--heat {
  color: #f59e0b;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  line-height: 1;
}

.badge-ok {
  background-color: #15803d;
  color: #f0fdf4;
}

.badge-ng {
  background-color: #991b1b;
  color: #fef2f2;
}

/* 細線アコーディオン */
.small-wire-accordion {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  overflow: hidden;
}

.accordion-summary {
  padding: 12px;
  font-size: 13px;
  font-weight: bold;
  color: #38bdf8;
  cursor: pointer;
  user-select: none;
  outline: none;
}

.accordion-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 10px 10px 10px;
}

.inner-item {
  background-color: #1e293b;
  border-color: #334155;
}

/* エラー中断用 */
.blocked-card {
  background-color: #0f172a;
  border: 2px dashed #ef4444;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.blocked-msg {
  margin: 0;
  color: #fca5a5;
  font-size: 13px;
  font-weight: bold;
}
</style>