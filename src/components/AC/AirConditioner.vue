<!-- src/components/AC/AirConditioner.vue -->
<script setup lang="ts">
import { useAirconCable } from '@/composables/useAirconCable';
import { AreaUnit, RoomType } from '@/utils/airconCalc';
import { CableTypeCode } from '@/types/appDefinitions';

// ==========================================
// Emits（他コンポーネント・配線計算ツール連携用）
// ==========================================
const emit = defineEmits<{
  (e: 'select-cable', payload: { cableType: CableTypeCode; wireSize: string }): void;
}>();

// ==========================================
// Composable の利用
// ==========================================
const {
  areaValue,
  areaUnit,
  roomType,
  showSpecTable,
  selectionResult,
  acMasterSpecs,
  getCableSelectionPayload
} = useAirconCable();

// ==========================================
// 選択肢オプション定義
// ==========================================
const unitOptions: { label: string; value: AreaUnit }[] = [
  { label: '畳（帖）', value: 'tatami' },
  { label: '㎡（平米）', value: 'sqm' },
  { label: '坪', value: 'tsubo' }
];

const roomOptions: { label: string; value: RoomType; desc: string }[] = [
  { label: '居間・リビング', value: 'living', desc: '標準的な補正 (×1.10)' },
  { label: 'LDK・吹抜け', value: 'ldk', desc: '吹き抜け・開放空間 (×1.20)' },
  { label: '台所・キッチン', value: 'kitchen', desc: '火気・調理器具あり (×1.30)' },
  { label: '和室', value: 'japanese', desc: '日当たり等考慮 (×1.05)' },
  { label: '寝室', value: 'bedroom', desc: '夜間主体の洋室 (×1.00)' },
  { label: '子供部屋・書斎', value: 'kids', desc: '標準的な洋室 (×1.00)' }
];

// ==========================================
// イベントハンドラー
// ==========================================
const handleSendToWireCalc = () => {
  const payload = getCableSelectionPayload();
  emit('select-cable', {
    cableType: payload.cableType,
    wireSize: payload.wireSize
  });
};
</script>

<template>
  <div class="aircon-container">
    <header class="card-header">
      <h2 class="title">エアコン適合選定 &amp; 専用回路計算</h2>
      <p class="subtitle">部屋の広さと用途から最適なエアコン能力・電源回路スペックを自動算出します</p>
    </header>

    <!-- 入力フォームセクション -->
    <section class="input-section">
      <div class="form-grid">
        <!-- 面積入力 -->
        <div class="form-group">
          <label class="form-label" for="area-input">部屋の広さ</label>
          <div class="input-with-unit">
            <input
              id="area-input"
              v-model.number="areaValue"
              type="number"
              min="1"
              max="200"
              step="0.5"
              class="form-input"
              placeholder="数値を入力量"
            />
            <select v-model="areaUnit" class="form-select unit-select">
              <option v-for="opt in unitOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 部屋のタイプ選択 -->
        <div class="form-group">
          <label class="form-label" for="room-select">部屋の種類・環境</label>
          <select id="room-select" v-model="roomType" class="form-select">
            <option v-for="opt in roomOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }} ({{ opt.desc }})
            </option>
          </select>
        </div>
      </div>
    </section>

    <!-- 計算結果表示カード -->
    <section class="result-section" :class="{ 'is-warning': selectionResult.isOverCapacity }">
      <div class="result-header">
        <span class="badge">選定結果</span>
        <h3 class="result-title">{{ selectionResult.selectedSpec.tatamiStandard }}（{{ selectionResult.selectedSpec.capacityKw }} kW）</h3>
      </div>

      <div class="tatami-info">
        <div class="info-pill">
          入力換算: <strong>{{ selectionResult.baseTatami }} 畳</strong>
        </div>
        <div class="info-pill highlight">
          熱負荷補正後の実効畳数: <strong>{{ selectionResult.effectiveTatami }} 畳</strong>
        </div>
      </div>

      <!-- 電気設備スペック一覧 -->
      <div class="spec-grid">
        <div class="spec-item">
          <span class="spec-label">定格電圧 / 電源</span>
          <span class="spec-value">{{ selectionResult.selectedSpec.voltage }}V ({{ selectionResult.selectedSpec.phase }})</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">運転電流 (目安/最大)</span>
          <span class="spec-value">{{ selectionResult.selectedSpec.ratedCurrentA }}A / {{ selectionResult.selectedSpec.maxCurrentA }}A</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">推奨専用ブレーカー</span>
          <span class="spec-value emphasize">
            {{ selectionResult.selectedSpec.breakerAmp }}A ({{ selectionResult.selectedSpec.breakerPoles }})
          </span>
        </div>
        <div class="spec-item">
          <span class="spec-label">推奨電線サイズ</span>
          <span class="spec-value emphasize">
            {{ selectionResult.selectedSpec.recommendedWireSize }}
          </span>
        </div>
      </div>

      <!-- 選定アドバイス・注意文 -->
      <div class="recommendation-note">
        <p>{{ selectionResult.recommendationNote }}</p>
      </div>

      <div class="action-row">
        <button type="button" class="btn btn-primary" @click="handleSendToWireCalc">
          この電線条件を配線計算に反映
        </button>
      </div>
    </section>

    <!-- エアコン能力マスタ参照（アコーディオン） -->
    <section class="master-table-section">
      <button
        type="button"
        class="accordion-toggle"
        @click="showSpecTable = !showSpecTable"
      >
        <span>エアコン能力・電気設備規格マスタ一覧</span>
        <span class="arrow" :class="{ 'is-open': showSpecTable }">▼</span>
      </button>

      <div v-if="showSpecTable" class="table-wrapper">
        <table class="spec-table">
          <thead>
            <tr>
              <th>目安畳数</th>
              <th>能力(kW)</th>
              <th>適合畳数</th>
              <th>電圧</th>
              <th>運転電流</th>
              <th>ブレーカー</th>
              <th>推奨電線</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="spec in acMasterSpecs"
              :key="spec.capacityKw"
              :class="{ 'is-selected': spec.capacityKw === selectionResult.selectedSpec.capacityKw }"
            >
              <td><strong>{{ spec.tatamiStandard }}</strong></td>
              <td>{{ spec.capacityKw }} kW</td>
              <td>{{ spec.minTatami }}～{{ spec.maxTatami }}畳</td>
              <td>{{ spec.voltage }}V</td>
              <td>{{ spec.ratedCurrentA }}A</td>
              <td>{{ spec.breakerAmp }}A ({{ spec.breakerPoles }})</td>
              <td>{{ spec.recommendedWireSize }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.aircon-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  background-color: transparent;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #f8fafc;
}

.card-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.75rem;
  text-align: center;
}

.title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.4rem 0;
}

.subtitle {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

/* フォーム関連 */
.input-section {
  background-color: transparent;
  padding: 0.5rem 0 1.5rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
}

.input-with-unit {
  display: flex;
  gap: 0.5rem;
}

.form-input, .form-select {
  padding: 0.6rem 0.8rem;
  background-color: #223046;
  border: 1px solid #334155;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input::placeholder {
  color: #64748b;
}

.form-input:focus, .form-select:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.3);
}

.form-input {
  flex: 1;
  width: 100%;
}

.unit-select {
  width: 120px;
}

.form-select option {
  background-color: #1e293b;
  color: #ffffff;
}

/* 計算結果カード */
.result-section {
  background-color: #131d31;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.result-section.is-warning {
  border-color: #f59e0b;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.badge {
  background-color: #0284c7;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}

.result-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #38bdf8;
  margin: 0;
}

.tatami-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.info-pill {
  font-size: 0.85rem;
  background-color: #1e293b;
  color: #cbd5e1;
  padding: 0.35rem 0.8rem;
  border-radius: 20px;
  border: 1px solid #334155;
}

.info-pill.highlight {
  border-color: #0284c7;
  color: #38bdf8;
  background-color: rgba(2, 132, 199, 0.15);
}

/* スペック格子 */
.spec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  background-color: #0f172a;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #1e293b;
  margin-bottom: 1rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.spec-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.spec-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.spec-value.emphasize {
  color: #38bdf8;
  font-weight: 700;
}

.recommendation-note {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #cbd5e1;
  background-color: rgba(30, 41, 59, 0.6);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 3px solid #0284c7;
  margin-bottom: 1.25rem;
}

.recommendation-note p {
  margin: 0;
}

.action-row {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.65rem 1.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #0284c7;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #0369a1;
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.4);
}

/* マスタテーブル（アコーディオン） */
.master-table-section {
  border-top: 1px solid #334155;
  padding-top: 1rem;
}

.accordion-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
}

.accordion-toggle:hover {
  color: #f8fafc;
}

.arrow {
  font-size: 0.75rem;
  transition: transform 0.2s;
}

.arrow.is-open {
  transform: rotate(180deg);
}

.table-wrapper {
  margin-top: 0.75rem;
  overflow-x: auto;
}

.spec-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.spec-table th, .spec-table td {
  padding: 0.6rem 0.75rem;
  border: 1px solid #334155;
}

.spec-table th {
  background-color: #1e293b;
  color: #cbd5e1;
  font-weight: 600;
}

.spec-table tr {
  background-color: #0f172a;
}

.spec-table tr.is-selected {
  background-color: #1e3a5f;
  color: #38bdf8;
  font-weight: 600;
}

.spec-table tr.is-selected td {
  border-color: #0284c7;
}
</style>