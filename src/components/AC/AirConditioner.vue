<!-- src/components/AC/AirConditioner.vue -->

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  AreaUnit,
  RoomType,
  BuildingType,
  calculateAirconSelection,
  AC_SPECS,
} from "@/utils/airconCalc";
import { CableTypeCode } from "@/types/appDefinitions";

/**
 * ==========================================
 * Emits
 * ==========================================
 *
 * エアコン選定結果を配線計算へ渡す。
 *
 * 電線だけではなく、
 * 電圧・電流・ブレーカー容量まで渡す。
 */
const emit = defineEmits<{
  (
    e: "select-cable",
    payload: {
      cableType: CableTypeCode;
      wireSize: string;
      voltage: 100 | 200;
      ratedCurrentA: number;
      maxCurrentA: number;
      breakerAmp: number;
      breakerPoles: string;
    },
  ): void;
}>();

/* ========================================== *
/* 状態管理*/
/* ==========================================*/
const areaValue = ref<number>(12);

const areaUnit = ref<AreaUnit>("tatami");

const roomType = ref<RoomType>("living");

const buildingType = ref<BuildingType>("wooden");

const showAdvanced = ref<boolean>(false);

const personCount = ref<number>(2);

const hasStrongSunlight = ref<boolean>(false);

const isTopFloor = ref<boolean>(false);

const hasHighCeiling = ref<boolean>(false);

const showSpecTable = ref<boolean>(false);

/* ==========================================
 /* 選択肢*/
/* ==========================================*/
const unitOptions: {
  label: string;
  value: AreaUnit;
}[] = [
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
];

const roomOptions: {
  label: string;
  value: RoomType;
  desc: string;
}[] = [
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
];

/**
 * ==========================================
 * エアコン選定結果
 * ==========================================
 */

const selectionResult = computed(() => {
  return calculateAirconSelection({
    areaValue: areaValue.value || 0,
    unit: areaUnit.value,
    roomType: roomType.value,
    buildingType: buildingType.value,
    personCount: personCount.value,
    hasStrongSunlight: hasStrongSunlight.value,
    isTopFloor: isTopFloor.value,
    hasHighCeiling: hasHighCeiling.value,
  });
});

/**
 * ==========================================
 * 配線計算へ送る
 * ==========================================
 */
const handleSendToWireCalc = () => {
  const spec = selectionResult.value.selectedSpec;

  /**
   * 選択されたエアコンの電気条件を
   * そのまま親(Home.vue)へ渡す。
   */
  emit("select-cable", {
    cableType: spec.cableTypeCode,
    wireSize: spec.recommendedWireSize,

    /**
     * 100V / 200V
     */
    voltage: spec.voltage,

    /**
     * 定格電流
     *
     * 表示・記録用。
     * 配線計算には maxCurrentA を使用する。
     */
    ratedCurrentA: spec.ratedCurrentA,

    /**
     * 最大運転電流
     *
     * 配線計算に使用する値。
     */
    maxCurrentA: spec.maxCurrentA,

    /**
     * 推奨ブレーカー容量
     */
    breakerAmp: spec.breakerAmp,

    /**
     * 2P1E / 2P2E
     */
    breakerPoles: spec.breakerPoles,
  });
};
</script>

<template>
  <div class="aircon-container">
    <header class="card-header">
      <h2 class="title">エアコン適合選定 &amp; 専用回路計算</h2>

      <p class="subtitle">
        部屋の広さ・環境条件から最適なエアコン能力と電源回路規格を自動算定します
      </p>
    </header>

    <!-- ==========================================
         入力フォーム
         ========================================== -->

    <section class="input-section">
      <div class="form-grid">
        <!-- 部屋の広さ -->
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

        <!-- 建物構造 -->
        <div class="form-group">
          <label class="form-label"> 建物構造 </label>

          <div class="segmented-control">
            <button
              type="button"
              class="segment-btn"
              :class="{ active: buildingType === 'wooden' }"
              @click="buildingType = 'wooden'"
            >
              木造・戸建て
            </button>

            <button
              type="button"
              class="segment-btn"
              :class="{ active: buildingType === 'reinforced' }"
              @click="buildingType = 'reinforced'"
            >
              鉄筋・マンション
            </button>
          </div>
        </div>

        <!-- 部屋種類 -->
        <div class="form-group full-width">
          <label class="form-label" for="room-select"> 部屋の種類・用途 </label>

          <select id="room-select" v-model="roomType" class="form-select">
            <option
              v-for="opt in roomOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }} ({{ opt.desc }})
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
          <span>
            {{
              showAdvanced
                ? "▲ 詳細環境条件を閉じる"
                : "▼ 日当たり・人数などの詳細条件を設定"
            }}
          </span>
        </button>
      </div>

      <div v-if="showAdvanced" class="advanced-panel">
        <div class="form-grid">
          <!-- 人数 -->
          <div class="form-group">
            <label class="form-label" for="person-input"> 想定在室人数 </label>

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

            <span class="field-hint"> ※標準2人を超える分は人熱負荷を加算 </span>
          </div>

          <!-- 環境条件 -->
          <div class="form-group full-width">
            <label class="form-label"> 部屋の環境影響（熱負荷要素） </label>

            <div class="chip-group">
              <label class="chip-label" :class="{ active: hasStrongSunlight }">
                <input
                  v-model="hasStrongSunlight"
                  type="checkbox"
                  class="hidden-checkbox"
                />

                ☀️ 日当たり強 / 南西向き大開口窓 (+10%)
              </label>

              <label class="chip-label" :class="{ active: isTopFloor }">
                <input
                  v-model="isTopFloor"
                  type="checkbox"
                  class="hidden-checkbox"
                />

                🏢 最上階 / 屋根直下 (+10%)
              </label>

              <label class="chip-label" :class="{ active: hasHighCeiling }">
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

    <!-- ==========================================
         計算結果
         ========================================== -->

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

      <div class="tatami-info">
        <div class="info-pill">
          入力面積:
          <strong> {{ selectionResult.baseTatami }} 畳 </strong>
        </div>

        <div class="info-pill highlight">
          補正後実効畳数:
          <strong> {{ selectionResult.effectiveTatami }} 畳相当 </strong>
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

      <!-- ==========================================
           電気設備スペック
           ========================================== -->

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
          <span class="spec-label"> 運転電流（定格 / 最大） </span>

          <span class="spec-value">
            {{ selectionResult.selectedSpec.ratedCurrentA }}A /
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

      <!-- ==========================================
           配線計算へ渡す電流の説明
           ========================================== -->

      <div class="calculation-current-note">
        <strong>
          配線計算へ反映する電流：
          {{ selectionResult.selectedSpec.maxCurrentA }}A
        </strong>

        <span> ※定格運転電流ではなく最大運転電流を使用 </span>
      </div>

      <!-- 推奨文 -->
      <div class="recommendation-note">
        <p>
          {{ selectionResult.recommendationNote }}
        </p>
      </div>

      <!-- ==========================================
           配線計算へ送る
           ========================================== -->

      <div class="action-row">
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSendToWireCalc"
        >
          この電線条件を配線計算に反映
        </button>
      </div>
    </section>

    <!-- ==========================================
         マスタ一覧
         ========================================== -->

    <section class="master-table-section">
      <button
        type="button"
        class="accordion-toggle"
        @click="showSpecTable = !showSpecTable"
      >
        <span> エアコン能力・電気設備規格マスタ一覧 </span>

        <span class="arrow" :class="{ 'is-open': showSpecTable }"> ▼ </span>
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
              <th>運転電流</th>
              <th>最大電流</th>
              <th>ブレーカー</th>
              <th>推奨電線</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="spec in AC_SPECS"
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

              <td>{{ spec.capacityKw }} kW</td>

              <td>～{{ spec.minTatami }}畳</td>

              <td>～{{ spec.maxTatami }}畳</td>

              <td>{{ spec.voltage }}V</td>

              <td>{{ spec.ratedCurrentA }}A</td>

              <td>{{ spec.maxCurrentA }}A</td>

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
.aircon-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  background-color: transparent;
  border-radius: 8px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
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

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.input-with-unit {
  display: flex;
  gap: 0.5rem;
}

.form-input,
.form-select {
  padding: 0.6rem 0.8rem;
  background-color: #223046;
  border: 1px solid #334155;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #ffffff;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-input::placeholder {
  color: #64748b;
}

.form-input:focus,
.form-select:focus {
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

.segmented-control {
  display: flex;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 3px;
}

.segment-btn {
  flex: 1;
  padding: 0.55rem;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.advanced-toggle-wrapper {
  margin-top: 1.25rem;
  text-align: center;
}

.btn-toggle-advanced {
  background: none;
  border: none;
  color: #38bdf8;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
}

.btn-toggle-advanced:hover {
  background-color: rgba(56, 189, 248, 0.1);
}

.advanced-panel {
  margin-top: 1rem;
  padding: 1.25rem;
  background-color: #131d31;
  border: 1px dashed #334155;
  border-radius: 8px;
}

.stepper-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #223046;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  width: fit-content;
}

.btn-step {
  width: 32px;
  height: 32px;
  background-color: #334155;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-step:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.person-display {
  font-size: 0.95rem;
  font-weight: bold;
  min-width: 45px;
  text-align: center;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.chip-label {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.8rem;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  font-size: 0.825rem;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.chip-label.active {
  background-color: rgba(2, 132, 199, 0.2);
  border-color: #0284c7;
  color: #38bdf8;
  font-weight: 600;
}

.hidden-checkbox {
  display: none;
}

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
  margin-bottom: 1rem;
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

.breakdown-box {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.825rem;
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
  margin-bottom: 0.2rem;
}

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

/* 配線計算に使用する電流の明示 */
.calculation-current-note {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background-color: #172554;
  border: 1px solid #2563eb;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.calculation-current-note strong {
  color: #60a5fa;
  font-size: 0.95rem;
}

.calculation-current-note span {
  color: #94a3b8;
  font-size: 0.75rem;
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

.spec-table th,
.spec-table td {
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
