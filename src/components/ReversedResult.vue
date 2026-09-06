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
      <div v-if="breakerStatus" class="result-card">
        <h4 class="card-title">送る側ブレーカー判定 (算出負荷: {{ calculatedLoadCurrent }} A)</h4>
        <p class="status-msg" :class="{ 'msg-warn': !breakerStatus.is20AOk }">
          {{ breakerStatus.message }}
        </p>
      </div>

      <div class="wire-table-card">
        <h4 class="card-title">選定可能電線・サイズ一覧</h4>
        <div class="table-wrapper">
          <table class="wire-table">
            <thead>
              <tr>
                <th>電線サイズ</th>
                <th>電圧降下限界</th>
                <th>耐熱許容電流</th>
                <th>判定</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="w in availableWires"
                :key="w.wireName"
                :class="{ 'is-ok': w.isOkForLoad }"
              >
                <td class="font-bold">{{ w.wireName }}</td>
                <td>{{ w.maxAmpereByDrop }} A</td>
                <td>{{ w.allowAmpereByHeat }} A</td>
                <td>
                  <span class="badge" :class="w.isOkForLoad ? 'badge-ok' : 'badge-ng'">
                    {{ w.isOkForLoad ? '⭕ 適合' : '❌ 不可' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
import { toRef } from 'vue'
import { ReversedResultProps } from '../types/appDefinitions'
import { useReversedCallc } from '../composables/useReversedCallc'

const props = defineProps<ReversedResultProps>()

const {
  calculatedLoadCurrent,
  calculationIssues,
  hasError,
  availableWires,
  breakerStatus
} = useReversedCallc(
  toRef(props, 'voltage'),
  toRef(props, 'targetPercent'),
  toRef(props, 'inputMode'),
  toRef(props, 'loadWatt'),
  toRef(props, 'loadCurrent'),
  toRef(props, 'oneWayDistance'),
  toRef(props, 'selectedSystemId'),
  toRef(props, 'selectedCableType'),
  toRef(props, 'powerFactor'),
  toRef(props, 'ignorePowerFactor'),
  toRef(props, 'loadType'),
  toRef(props, 'motorKw'),
  toRef(props, 'installationType'),
  toRef(props, 'isContinuous')
)
</script>

<style scoped>
.reversed-result-container {
  margin-top: 16px;
}

.issues-card {
  background-color: #0f172a;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #334155;
}

.issues-title {
  font-size: 15px;
  font-weight: bold;
  color: #f8fafc;
  margin-top: 0;
  margin-bottom: 12px;
}

.issue-item {
  padding: 10px 14px;
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

.result-card,
.wire-table-card {
  background-color: #1e293b;
  border-radius: 12px;
  padding: 16px;
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
  font-size: 15px;
  font-weight: bold;
  color: #4ade80;
}

.status-msg.msg-warn {
  color: #f87171;
}

.table-wrapper {
  overflow-x: auto;
}

.wire-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #cbd5e1;
}

.wire-table th,
.wire-table td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid #334155;
  white-space: nowrap;
  vertical-align: middle;
}

.font-bold {
  font-weight: bold;
  color: #f8fafc;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  padding: 4px 10px;
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

.blocked-card {
  background-color: #0f172a;
  border: 2px dashed #ef4444;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.blocked-msg {
  margin: 0;
  color: #fca5a5;
  font-size: 13px;
  font-weight: bold;
}
</style>