<!-- src/components/AC/AirconWireLimitCard.vue -->
<script setup lang="ts">
import { watch, computed } from "vue";
import type { AirconCableSelectionPayload } from "@/base/airconBase";
import { useAirconCableLink } from "@/composables/useAirconCableLink";

const props = defineProps<{
  /** AirConditioner.vue が emit する選定結果 */
  payload: AirconCableSelectionPayload | null;
}>();

const link = useAirconCableLink();
const {
  selectedWireName,
  voltage,
  totalI,
  targetPercent,
  distance,
  limitMeters,
  limit3Meters,
  wireOptions,
  dropCheck,
  status,
  allowAmp,
  wireRows,
  suitableWire,
  isOverCurrent,
  currentSystem,
} = link;

watch(
  () => props.payload,
  (p) => {
    if (p) link.applyAirconPayload(p);
  },
  { immediate: true, deep: true }
);

const statusLabel = computed(() => {
  switch (status.value) {
    case "ok":
      return "適合";
    case "warn":
      return "要注意";
    case "ng":
      return "不適合";
    default:
      return "未選定";
  }
});

const isRecommendedWire = computed(
  () => props.payload?.wireSize === selectedWireName.value
);
</script>

<template>
  <section v-if="payload" class="limit-card" :class="`is-${status}`">
    <header class="limit-header">
      <span class="badge">配線計算連携</span>
      <h3 class="limit-title">使用電線の限界配線長</h3>
      <span class="status-pill" :class="`is-${status}`">{{ statusLabel }}</span>
    </header>

    <p class="source-line">
      {{ payload.tatamiStandard }}（{{ payload.capacityKw }}kW）／
      {{ currentSystem?.label ?? payload.systemId }}／ {{ voltage }}V ／
      設計電流 {{ totalI }}A
    </p>

    <!-- 電線選択 -->
    <div class="wire-row">
      <label class="wire-label" for="wire-select">使用電線</label>
      <button
        type="button"
        class="btn-step"
        title="細く"
        @click="link.stepWireSize('prev')"
      >
        −
      </button>
      <select id="wire-select" v-model="selectedWireName" class="wire-select">
        <option v-for="w in wireOptions" :key="w.name" :value="w.name">
          {{ w.name }}（{{ w.area }}mm² / {{ w.amp }}A）
        </option>
      </select>
      <button
        type="button"
        class="btn-step"
        title="太く"
        @click="link.stepWireSize('next')"
      >
        ＋
      </button>
      <button
        v-if="!isRecommendedWire"
        type="button"
        class="btn-link"
        @click="link.resetToRecommended"
      >
        推奨に戻す
      </button>
    </div>

    <!-- 限界長 -->
    <div class="limit-grid">
      <div class="limit-main">
        <span class="limit-label">限界配線長（降下 {{ targetPercent.toFixed(1) }}%）</span>
        <span class="limit-value">{{ limitMeters }} <small>m</small></span>
      </div>
      <div class="limit-sub">
        <span class="limit-label">3.0%降下時</span>
        <span class="limit-value-sub">{{ limit3Meters }} m</span>
      </div>
      <div class="limit-sub">
        <span class="limit-label">電線の許容電流</span>
        <span class="limit-value-sub" :class="{ danger: isOverCurrent }">
          {{ allowAmp }} A
        </span>
      </div>
    </div>

    <p v-if="isOverCurrent" class="alert danger">
      設計電流 {{ totalI }}A が、選択した電線の許容電流を超えています。太い電線を選択してください。
    </p>

    <!-- 予定配線長の判定 -->
    <div v-if="dropCheck" class="drop-check" :class="`is-${status}`">
      予定配線長 <strong>{{ distance }}m</strong> → 電圧降下
      <strong>{{ dropCheck.volts }}V（{{ dropCheck.percent }}%）</strong>
      <span v-if="dropCheck.okTarget">／ 基準 {{ targetPercent.toFixed(1) }}% クリア</span>
      <span v-else-if="dropCheck.ok3">／ 基準超過（3.0%以内）</span>
      <span v-else>／ 3.0%超過：太い電線へ変更してください</span>
      <div v-if="suitableWire" class="hint">
        この配線長での最小適合電線: <strong>{{ suitableWire.wireName }}</strong>
      </div>
    </div>
    <p v-else class="hint">
      ※エアコン側で「予定配線長」を入力すると、電圧降下の合否と最小適合電線を表示します。
    </p>

    <!-- サイズ別一覧 -->
    <details class="wire-table-wrap">
      <summary>電線サイズ別の限界配線長</summary>
      <div class="table-scroll">
        <table class="wire-table">
          <thead>
            <tr>
              <th>電線</th>
              <th>断面積</th>
              <th>許容電流</th>
              <th>限界長({{ targetPercent.toFixed(1) }}%)</th>
              <th>判定</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in wireRows"
              :key="r.wireName"
              :class="{
                'is-selected': r.wireName === selectedWireName,
                'is-recommended': r.isRecommended,
              }"
              @click="selectedWireName = r.wireName"
            >
              <td>{{ r.wireName }}</td>
              <td>{{ r.area }}mm²</td>
              <td>{{ r.allowAmpereByHeat }}A</td>
              <td>{{ r.maxDistanceMeters }}m</td>
              <td>
                <span v-if="r.isRecommended">★最小適合</span>
                <span v-else-if="r.isOkForLoad">○</span>
                <span v-else class="ng">×</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </section>
</template>

<style scoped>
.limit-card {
  margin-top: 1rem;
  padding: 1.25rem;
  background-color: #111a2e;
  border: 1px solid #1e293b;
  border-left: 4px solid #0284c7;
  border-radius: 12px;
  color: #f8fafc;
  box-sizing: border-box;
}
.limit-card.is-warn { border-left-color: #f59e0b; }
.limit-card.is-ng { border-left-color: #ef4444; }

.limit-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.badge { background: #0284c7; color: #fff; font-size: 0.8rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 6px; }
.limit-title { margin: 0; font-size: 1.15rem; font-weight: 700; flex: 1; }
.status-pill { font-size: 0.8rem; font-weight: 700; padding: 0.25rem 0.7rem; border-radius: 20px; background: #162032; border: 1px solid #2d3d54; color: #94a3b8; }
.status-pill.is-ok { color: #34d399; border-color: #34d399; background: rgba(52,211,153,.12); }
.status-pill.is-warn { color: #fbbf24; border-color: #fbbf24; background: rgba(251,191,36,.12); }
.status-pill.is-ng { color: #f87171; border-color: #f87171; background: rgba(248,113,113,.12); }

.source-line { margin: 0.6rem 0 1rem; font-size: 0.82rem; color: #94a3b8; }

.wire-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.wire-label { font-size: 0.9rem; font-weight: 700; }
.wire-select { flex: 1; min-width: 180px; padding: 0.6rem 0.8rem; background: #1a2638; border: 1px solid #2d3d54; border-radius: 8px; color: #fff; font-size: 0.95rem; color-scheme: dark; }
.wire-select:focus { outline: none; border-color: #0284c7; }
.btn-step { width: 36px; height: 36px; background: #2d3d54; color: #fff; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 700; cursor: pointer; }
.btn-step:hover { background: #0284c7; }
.btn-link { background: none; border: none; color: #38bdf8; font-size: 0.85rem; cursor: pointer; text-decoration: underline; }

.limit-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.75rem; background: #0d1526; border: 1px solid #2d3d54; border-radius: 10px; padding: 1rem; }
.limit-main, .limit-sub { display: flex; flex-direction: column; gap: 0.25rem; }
.limit-label { font-size: 0.75rem; color: #94a3b8; }
.limit-value { font-size: 2.2rem; font-weight: 800; color: #38bdf8; line-height: 1.1; }
.limit-value small { font-size: 1rem; font-weight: 600; }
.limit-value-sub { font-size: 1.15rem; font-weight: 700; color: #f1f5f9; }
.limit-value-sub.danger { color: #f87171; }
@media (max-width: 560px) { .limit-grid { grid-template-columns: 1fr 1fr; } .limit-main { grid-column: 1 / -1; } }

.alert { margin: 0.75rem 0 0; padding: 0.7rem 0.9rem; border-radius: 8px; font-size: 0.85rem; }
.alert.danger { background: rgba(248,113,113,.12); border-left: 4px solid #ef4444; color: #fecaca; }

.drop-check { margin-top: 0.9rem; padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.9rem; background: rgba(2,132,199,.1); border-left: 4px solid #0284c7; }
.drop-check.is-warn { background: rgba(251,191,36,.1); border-left-color: #f59e0b; }
.drop-check.is-ng { background: rgba(248,113,113,.1); border-left-color: #ef4444; }
.hint { margin: 0.5rem 0 0; font-size: 0.8rem; color: #94a3b8; }

.wire-table-wrap { margin-top: 1rem; }
.wire-table-wrap summary { cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
.table-scroll { overflow-x: auto; margin-top: 0.6rem; }
.wire-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.wire-table th, .wire-table td { padding: 0.5rem 0.7rem; border: 1px solid #2d3d54; white-space: nowrap; text-align: left; }
.wire-table th { background: #162032; color: #cbd5e1; }
.wire-table tr { background: #0d1526; cursor: pointer; }
.wire-table tr.is-recommended td { color: #34d399; }
.wire-table tr.is-selected { background: #1e3a5f; color: #38bdf8; font-weight: 700; }
.ng { color: #f87171; }
</style>
