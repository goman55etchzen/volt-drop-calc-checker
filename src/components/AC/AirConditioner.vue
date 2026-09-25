<!-- src/components/AC/AirConditioner.vue -->

<script setup lang="ts">
import {
  useAirconCable,
  type AirconCableSelectionPayload,
} from "@/composables/useAirconCable";

import type { CableTypeCode } from "@/types/appDefinitions";

// ==========================================
// Emits
// ==========================================

const emit = defineEmits<{
  (e: "select-cable", payload: AirconCableSelectionPayload): void;
}>();

// ==========================================
// Composable
// ==========================================

const {
  areaValue,
  areaUnit,
  roomType,
  buildingType,
  personCount,
  hasStrongSunlight,
  isTopFloor,
  hasHighCeiling,

  showSpecTable,

  selectionResult,
  acMasterSpecs,

  toggleSpecTable,
  resetInputs,
  getCableSelectionPayload,
} = useAirconCable();

// ==========================================
// UI
// ==========================================

import { ref } from "vue";

const showAdvanced = ref<boolean>(false);

// ==========================================
// 選択肢
// ==========================================

const unitOptions = [
  {
    label: "畳（帖）",
    value: "tatami",
  },
  {
    label: "㎡（平米）",
    value: "sqm",
  },
  {
    label: "坪",
    value: "tsubo",
  },
] as const;

const roomOptions = [
  {
    label: "居間・リビング",
    value: "living",
    desc: "標準補正 ×1.10",
  },
  {
    label: "LDK・吹抜け",
    value: "ldk",
    desc: "開放空間 ×1.20",
  },
  {
    label: "台所・キッチン",
    value: "kitchen",
    desc: "火気・熱源あり ×1.30",
  },
  {
    label: "和室",
    value: "japanese",
    desc: "標準和室 ×1.05",
  },
  {
    label: "寝室",
    value: "bedroom",
    desc: "夜間主体 ×1.00",
  },
  {
    label: "子供部屋・書斎",
    value: "kids",
    desc: "標準洋室 ×1.00",
  },
] as const;

// ==========================================
// 配線計算へ送る
// ==========================================

const handleSendToWireCalc = () => {
  const payload = getCableSelectionPayload();

  emit("select-cable", payload);
};
</script>

<template>
  <div class="aircon-container">
    <!-- ========================================
         ヘッダー
         ======================================== -->

    <header class="card-header">
      <div class="header-main">
        <h2 class="title">エアコン適合選定 &amp; 専用回路計算</h2>

        <button
          type="button"
          class="btn-reset"
          title="入力内容を初期状態に戻します"
          @click="resetInputs"
        >
          🔄 設定リセット
        </button>
      </div>

      <p class="subtitle">
        部屋の広さ・環境条件から エアコン能力と電源回路規格を算定します
      </p>
    </header>

    <!-- ========================================
         入力
         ======================================== -->

    <section class="input-section">
      <div class="form-grid">
        <!-- 面積 -->

        <div class="form-group">
          <label class="form-label" for="area-input"> 部屋の広さ </label>

          <div class="input-with-unit">
            <input
              id="area-input"
              v-model.number="areaValue"
              type="number"
              min="1"
              max="200"
              step="0.5"
              class="form-input"
              placeholder="広さを入力"
            />

            <select v-model="areaUnit" class="form-select unit-select">
              <option
                v-for="opt in unitOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 建物 -->

        <div class="form-group">
          <label class="form-label"> 建物構造 </label>

          <div class="segmented-control">
            <button
              type="button"
              class="segment-btn"
              :class="{
                active: buildingType === 'wooden',
              }"
              @click="buildingType = 'wooden'"
            >
              木造・戸建て
            </button>

            <button
              type="button"
              class="segment-btn"
              :class="{
                active: buildingType === 'reinforced',
              }"
              @click="buildingType = 'reinforced'"
            >
              鉄筋・マンション
            </button>
          </div>
        </div>

        <!-- 部屋 -->

        <div class="form-group full-width">
          <label class="form-label" for="room-select"> 部屋の種類・用途 </label>

          <select id="room-select" v-model="roomType" class="form-select">
            <option
              v-for="opt in roomOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
              ({{ opt.desc }})
            </option>
          </select>
        </div>
      </div>

      <!-- 詳細条件 -->

      <div class="advanced-toggle-wrapper">
        <button
          type="button"
          class="btn-toggle-advanced"
          @click="showAdvanced = !showAdvanced"
        >
          {{
            showAdvanced
              ? "▲ 詳細環境条件を閉じる"
              : "▼ 日当たり・人数などの詳細条件を設定"
          }}
        </button>
      </div>

      <div v-if="showAdvanced" class="advanced-panel">
        <div class="form-grid">
          <!-- 人数 -->

          <div class="form-group">
            <label class="form-label"> 想定在室人数 </label>

            <div class="stepper-input">
              <button
                type="button"
                class="btn-step"
                :disabled="personCount <= 1"
                @click="personCount = Math.max(1, personCount - 1)"
              >
                -
              </button>

              <span class="person-display"> {{ personCount }} 人 </span>

              <button type="button" class="btn-step" @click="personCount++">
                +
              </button>
            </div>

            <span class="field-hint">
              ※標準2人を超える分は 人熱負荷を加算
            </span>
          </div>

          <!-- 環境 -->

          <div class="form-group full-width">
            <label class="form-label"> 部屋の環境影響 </label>

            <div class="chip-group">
              <label
                class="chip-label"
                :class="{
                  active: hasStrongSunlight,
                }"
              >
                <input
                  v-model="hasStrongSunlight"
                  type="checkbox"
                  class="hidden-checkbox"
                />

                ☀️ 日当たり強 / 南西向き大開口窓 (+10%)
              </label>

              <label
                class="chip-label"
                :class="{
                  active: isTopFloor,
                }"
              >
                <input
                  v-model="isTopFloor"
                  type="checkbox"
                  class="hidden-checkbox"
                />

                🏢 最上階 / 屋根直下 (+10%)
              </label>

              <label
                class="chip-label"
                :class="{
                  active: hasHighCeiling,
                }"
              >
                <input
                  v-model="hasHighCeiling"
                  type="checkbox"
                  class="hidden-checkbox"
                />

                🏠 吹き抜け / 高天井 (+15%)
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================
         選定結果
         ======================================== -->

    <section
      class="result-section"
      :class="{
        'is-warning': selectionResult.isOverCapacity,
      }"
    >
      <div class="result-header">
        <span class="badge"> 推奨エアコン能力 </span>

        <h3 class="result-title">
          {{ selectionResult.selectedSpec.tatamiStandard }}

          （{{ selectionResult.selectedSpec.capacityKw }} kW）
        </h3>
      </div>

      <!-- 畳数 -->

      <div class="tatami-info">
        <div class="info-pill">
          入力面積:
          <strong>
            {{ selectionResult.baseTatami }}
            畳
          </strong>
        </div>

        <div class="info-pill highlight">
          補正後実効畳数:
          <strong>
            {{ selectionResult.effectiveTatami }}
            畳相当
          </strong>
        </div>
      </div>

      <!-- 計算根拠 -->

      <div
        v-if="selectionResult.breakdownNotes.length > 0"
        class="breakdown-box"
      >
        <span class="breakdown-title"> 熱負荷補正の内訳: </span>

        <ul class="breakdown-list">
          <li v-for="(note, idx) in selectionResult.breakdownNotes" :key="idx">
            {{ note }}
          </li>
        </ul>
      </div>

      <!-- ======================================
           スペック
           ====================================== -->

      <div class="spec-grid">
        <div class="spec-item">
          <span class="spec-label"> 定格電圧 / 電源 </span>

          <span class="spec-value">
            {{ selectionResult.selectedSpec.voltage }}V ({{
              selectionResult.selectedSpec.phase
            }})
          </span>
        </div>

        <div class="spec-item">
          <span class="spec-label"> 定格運転電流 </span>

          <span class="spec-value">
            {{ selectionResult.selectedSpec.ratedCurrentA }}A
          </span>
        </div>

        <div class="spec-item">
          <span class="spec-label"> 最大運転電流 </span>

          <span class="spec-value emphasize">
            {{ selectionResult.selectedSpec.maxCurrentA }}A
          </span>
        </div>

        <div class="spec-item">
          <span class="spec-label"> 配線計算使用電流 </span>

          <span class="spec-value emphasize">
            {{ selectionResult.selectedSpec.maxCurrentA }}A
          </span>
        </div>

        <div class="spec-item">
          <span class="spec-label"> 推奨専用ブレーカー </span>

          <span class="spec-value emphasize">
            {{ selectionResult.selectedSpec.breakerAmp }}A ({{
              selectionResult.selectedSpec.breakerPoles
            }})
          </span>
        </div>

        <div class="spec-item">
          <span class="spec-label"> 推奨電線サイズ </span>

          <span class="spec-value emphasize">
            {{ selectionResult.selectedSpec.recommendedWireSize }}
          </span>
        </div>
      </div>

      <!-- 注意 -->

      <div class="recommendation-note">
        <p>
          {{ selectionResult.recommendationNote }}
        </p>
      </div>

      <!-- 配線計算へ -->

      <div class="action-row">
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSendToWireCalc"
        >
          この電線サイズ （{{
            selectionResult.selectedSpec.recommendedWireSize
          }}） で電圧降下計算へ送る
        </button>
      </div>
    </section>

    <!-- ========================================
         マスタ
         ======================================== -->

    <section class="master-table-section">
      <button type="button" class="accordion-toggle" @click="toggleSpecTable">
        <span> エアコン能力・ 電気設備規格マスタ一覧 </span>

        <span
          class="arrow"
          :class="{
            'is-open': showSpecTable,
          }"
        >
          ▼
        </span>
      </button>

      <div v-if="showSpecTable" class="table-wrapper">
        <table class="spec-table">
          <thead>
            <tr>
              <th>目安畳数</th>
              <th>能力(kW)</th>
              <th>適合(木造)</th>
              <th>適合(鉄筋)</th>
              <th>電圧</th>
              <th>定格電流</th>
              <th>最大電流</th>
              <th>ブレーカー</th>
              <th>推奨電線</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="spec in acMasterSpecs"
              :key="spec.capacityKw"
              :class="{
                'is-selected':
                  spec.capacityKw === selectionResult.selectedSpec.capacityKw,
              }"
            >
              <td>
                <strong>
                  {{ spec.tatamiStandard }}
                </strong>
              </td>

              <td>
                {{ spec.capacityKw }}
                kW
              </td>

              <td>～{{ spec.minTatami }}畳</td>

              <td>～{{ spec.maxTatami }}畳</td>

              <td>{{ spec.voltage }}V</td>

              <td>{{ spec.ratedCurrentA }}A</td>

              <td>
                <strong> {{ spec.maxCurrentA }}A </strong>
              </td>

              <td>{{ spec.breakerAmp }}A ({{ spec.breakerPoles }})</td>

              <td>
                {{ spec.recommendedWireSize }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 全体コンテナを電動機モード同様のカードスタイルに変更 */
.aircon-container {
  width: 100%;
  max-width: 100%;
  padding: 1.5rem;
  background-color: #111a2e; /* 電動機モードと同等の濃紺背景 */
  border: 1px solid #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  color: #f8fafc;
  box-sizing: border-box;
}

/* ヘッダーデザイン */
.card-header {
  margin-bottom: 1.75rem;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 1rem;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.4rem;
  flex-wrap: wrap;
}

.title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* タイトル頭にアイコンを追加（擬似要素） */
.title::before {
  content: "❄️"; /* アイコン演出 */
  font-size: 1.2rem;
}

.btn-reset {
  background-color: #1a2638;
  border: 1px solid #2d3d54;
  color: #94a3b8;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background-color: #2d3d54;
  color: #f8fafc;
  border-color: #0284c7;
}

.subtitle {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

/* 入力セクション */
.input-section {
  background-color: transparent;
  padding: 0 0 1rem 0;
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

.form-group.full-width {
  grid-column: 1 / -1;
}

/* 電動機モード風のラベルスタイル（左揃え・太字） */
.form-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
  text-align: left;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.input-with-unit {
  display: flex;
  gap: 0.5rem;
}

/* 入力フォーム・セレクトボックス（暗めの統一感ある配色） */
.form-input,
.form-select {
  padding: 0.65rem 0.85rem;
  background-color: #1a2638;
  border: 1px solid #2d3d54;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #ffffff;
  outline: none;
  transition: all 0.2s ease;
}

.form-input::placeholder {
  color: #64748b;
}

.form-input:focus,
.form-select:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.4);
  background-color: #1e2e45;
}

.form-input {
  flex: 1;
  width: 100%;
}

.unit-select {
  width: 120px;
}

.form-select option {
  background-color: #162032;
  color: #ffffff;
}

/* セグメントコントロール（木造/鉄筋切り替え） */
.segmented-control {
  display: flex;
  background-color: #162032;
  border: 1px solid #2d3d54;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.segment-btn {
  flex: 1;
  padding: 0.6rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

/* 詳細条件のアコーディオン開閉ボタン */
.advanced-toggle-wrapper {
  margin-top: 1.25rem;
  text-align: center;
}

.btn-toggle-advanced {
  background: none;
  border: none;
  color: #38bdf8;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.btn-toggle-advanced:hover {
  background-color: rgba(56, 189, 248, 0.1);
}

.advanced-panel {
  margin-top: 1rem;
  padding: 1.25rem;
  background-color: #0d1526;
  border: 1px dashed #2d3d54;
  border-radius: 8px;
}

/* ステッパー（人数設定） */
.stepper-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #1a2638;
  border: 1px solid #2d3d54;
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  width: fit-content;
}

.btn-step {
  width: 32px;
  height: 32px;
  background-color: #2d3d54;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-step:hover:not(:disabled) {
  background-color: #0284c7;
}

.btn-step:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.person-display {
  font-size: 0.95rem;
  font-weight: bold;
  min-width: 45px;
  text-align: center;
}

/* チップ選択肢 */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.chip-label {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.9rem;
  background-color: #1a2638;
  border: 1px solid #2d3d54;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.chip-label.active {
  background-color: rgba(2, 132, 199, 0.2);
  border-color: #0284c7;
  color: #38bdf8;
  font-weight: 700;
}

.hidden-checkbox {
  display: none;
}

/* 結果表示カード */
.result-section {
  background-color: #0d1526;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 1.25rem;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

.result-section.is-warning {
  border-color: #f59e0b;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.badge {
  background-color: #0284c7;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
}

.result-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #38bdf8;
  margin: 0;
}

.tatami-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-pill {
  font-size: 0.85rem;
  background-color: #162032;
  color: #cbd5e1;
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  border: 1px solid #2d3d54;
}

.info-pill.highlight {
  border-color: #0284c7;
  color: #38bdf8;
  background-color: rgba(2, 132, 199, 0.15);
}

.breakdown-box {
  background-color: #162032;
  border: 1px solid #2d3d54;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.breakdown-title {
  color: #94a3b8;
  font-weight: 600;
  display: block;
  margin-bottom: 0.4rem;
}

.breakdown-list {
  margin: 0;
  padding-left: 1.2rem;
  color: #cbd5e1;
}

.breakdown-list li {
  margin-bottom: 0.25rem;
}

/* スペックグリッド */
.spec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
  background-color: #162032;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #2d3d54;
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
  background-color: rgba(2, 132, 199, 0.1);
  padding: 0.85rem 1rem;
  border-radius: 8px;
  border-left: 4px solid #0284c7;
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
  padding: 0.7rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #0284c7;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.btn-primary:hover {
  background-color: #0369a1;
  transform: translateY(-1px);
}

/* マスタテーブル */
.master-table-section {
  border-top: 1px solid #1e293b;
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

.spec-table th,
.spec-table td {
  padding: 0.65rem 0.75rem;
  border: 1px solid #2d3d54;
  white-space: nowrap;
}

.spec-table th {
  background-color: #162032;
  color: #cbd5e1;
  font-weight: 600;
}

.spec-table tr {
  background-color: #0d1526;
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