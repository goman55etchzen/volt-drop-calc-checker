<!-- src/components/MotorCalc.vue -->
<template>
  <div class="motor-calc-container">
    
    <!-- 入力フォームカード -->
    <div class="form-card mb-12">
      <div class="card-header">
        <span class="card-title">⚙️ 電動機仕様・入力設定</span>
      </div>

      <!-- 出力 (kW) 選択 -->
      <div class="input-group">
        <label class="sub-label">電動機定格出力 (kW)</label>
        <input
          v-model.number="outputKw"
          type="number"
          step="0.1"
          min="0.1"
          class="text-input"
        />
        <div class="preset-chips">
          <button
            v-for="kw in [0.75, 1.5, 2.2, 3.7, 5.5, 7.5, 11, 15]"
            :key="kw"
            type="button"
            :class="['chip-btn', outputKw === kw ? 'active' : '']"
            @click="setPreset(kw)"
          >
            {{ kw }}kW
          </button>
        </div>
      </div>

      <!-- 電圧・周波数・環境条件 (コンポーネント化してスッキリ分離) -->
      <Selected1
        v-model:voltage="voltage"
        v-model:frequency="frequency"
        v-model:environment="environment"
        class="mt-12"
      />

      <!-- 力率・効率 -->
      <div class="responsive-grid grid-3 mt-12">
        <div class="input-group">
          <label class="sub-label">現状力率 cosθ</label>
          <input
            v-model.number="powerFactor"
            type="number"
            step="0.01"
            min="0.5"
            max="1.0"
            class="text-input"
          />
        </div>
        <div class="input-group">
          <label class="sub-label">目標力率 cosθ</label>
          <input
            v-model.number="targetPowerFactor"
            type="number"
            step="0.01"
            min="0.8"
            max="1.0"
            class="text-input"
          />
        </div>
        <div class="input-group">
          <label class="sub-label">効率 η (エータ)</label>
          <input
            v-model.number="efficiency"
            type="number"
            step="0.01"
            min="0.5"
            max="1.0"
            class="text-input"
          />
        </div>
      </div>

      <!-- 多台数・他負荷設定 -->
      <div class="responsive-grid grid-3 mt-12">
        <div class="input-group">
          <label class="sub-label">電動機台数</label>
          <input
            v-model.number="motorCount"
            type="number"
            min="1"
            step="1"
            class="text-input"
          />
        </div>
        <div class="input-group">
          <label class="sub-label">その他一般負荷 Ir (A)</label>
          <input
            v-model.number="otherLoadAmp"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            class="text-input"
          />
        </div>
        <div class="input-group">
          <label class="sub-label">合算定格電流 (Im×台数 + Ir)</label>
          <div class="text-input-readonly">
            {{ totalLoadAmp.toFixed(2) }} A
          </div>
        </div>
      </div>

      <!-- 駆動方式 選択トグル -->
      <div class="input-group mt-12">
        <label class="sub-label">駆動方式選択</label>
        <div class="preset-chips">
          <button
            type="button"
            :class="['chip-btn', driveMode === 'direct' ? 'active' : '']"
            @click="driveMode = 'direct'"
          >
            商用電源直結 (通常)
          </button>
          <button
            type="button"
            :class="['chip-btn', driveMode === 'inverter' ? 'active' : '']"
            @click="driveMode = 'inverter'"
          >
            インバータ駆動
          </button>
        </div>
      </div>

      <!-- 保護遮断器 種別選択（BreakerSelect コンポーネント） -->
      <BreakerSelect
        v-model="breakerTypeMode"
        :drive-mode="driveMode"
        :is-over15-k-w="breakerInfo.isOver15kW"
        :motor-count="motorCount"
        :other-load-amp="otherLoadAmp"
        class="mt-12"
      />
    </div>

    <!-- 結果カード (定格電流・許容電流) -->
    <div class="result-card">
      <div class="main-result">
        <span class="result-label">
          {{ driveMode === 'inverter' ? '計算一次定格電流 (インバータ)' : '単体計算定格電流 (1台あたり)' }}
        </span>
        <div class="result-value-group">
          <span class="result-value">{{ calculatedAmp }}</span>
          <span class="result-unit">A</span>
        </div>
      </div>

      <div class="sub-results">
        <div class="sub-item">
          <span class="sub-title">簡易目安 (kW×{{ voltage >= 400 ? 2 : 4 }})</span>
          <span class="result-value-group">約 {{ simpleAmp }} A</span>
        </div>
        <div class="sub-item">
          <span class="sub-title">幹線電線最小許容電流</span>
          <span class="sub-value">{{ requiredWireAmp.toFixed(1) }} A</span>
        </div>
        <div class="sub-item">
          <span class="sub-title">推奨遮断器容量 ({{ breakerInfo.selectedType === 'motor_breaker' ? 'MB' : 'MCCB' }})</span>
          <span class="sub-value">{{ breakerInfo.recommendedAmp }} A</span>
        </div>
      </div>

      <div v-if="breakerInfo.warningNote" class="warning-box mt-8">
        <p class="warning-text">⚠️ {{ breakerInfo.warningNote }}</p>
      </div>
    </div>

    <!-- 進相コンデンサ カード -->
    <div class="section-card mt-12">
      <div class="card-header">
        <span class="card-title">🔋 進相コンデンサ (力率改善)</span>
        <span class="badge badge-success" v-if="driveMode !== 'inverter'">
          目標力率 {{ (targetPowerFactor * 100).toFixed(0) }}%
        </span>
        <span class="badge badge-danger" v-else>
          二次側接続禁止
        </span>
      </div>

      <div class="responsive-grid grid-3">
        <div class="grid-item">
          <span class="grid-label">必要容量 / 推奨標準</span>
          <span class="grid-value highlight">{{ capacitorInfo.recommendedKvar }} kvar</span>
          <span class="grid-sub">(計算必要値: {{ capacitorInfo.requiredKvar }} kvar)</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">推奨静電容量</span>
          <span class="grid-value highlight">{{ capacitorInfo.recommendedMicroFarad ?? '-' }} μF</span>
          <span class="grid-sub">@ {{ voltage }}V ({{ frequency }}Hz)</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">備考</span>
          <p class="description-text">{{ capacitorInfo.dischargeResistorNote }}</p>
        </div>
      </div>

      <!-- 適合メーカー同等品・外形寸法一覧 -->
      <div v-if="driveMode !== 'inverter' && matchedCapacitors.length > 0" class="catalog-match-box mt-12">
        <div class="sub-label mb-8">適合メーカー同等品・外形寸法一覧</div>
        <div class="catalog-table-wrapper">
          <table class="catalog-table">
            <thead>
              <tr>
                <th>メーカー</th>
                <th>型番</th>
                <th>容量</th>
                <th>外形寸法 (W×D×H mm)</th>
                <th>端子</th>
                <th>取付</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in matchedCapacitors" :key="item.id">
                <td class="mfr-name">{{ item.mfr }}</td>
                <td class="part-no">{{ item.part_number }}</td>
                <td>{{ item.capacity_uf }} μF</td>
                <td>{{ item.dimensions.w }} × {{ item.dimensions.d }} × {{ item.dimensions.h }}</td>
                <td>{{ item.terminal }}</td>
                <td>{{ item.mount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 漏電遮断器 (ELCB) 選定カード -->
    <div class="section-card mt-12">
      <div class="card-header">
        <span class="card-title">🛡️ 漏電遮断器 (ELCB) 選定</span>
        <span class="badge" :class="elcbInfo.isMandatory ? 'badge-danger' : 'badge-info'">
          {{ elcbInfo.isMandatory ? '設置必須' : '標準推奨' }}
        </span>
      </div>

      <div class="responsive-grid grid-3">
        <div class="grid-item">
          <span class="grid-label">定格電流</span>
          <span class="grid-value">{{ elcbInfo.recommendedAmp }} A</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">定格感度電流</span>
          <span class="grid-value highlight">{{ elcbInfo.sensitivityCurrent }} mA</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">動作時間</span>
          <span class="grid-value">{{ elcbInfo.operatingTime }}</span>
        </div>
      </div>
      <p class="description-text mt-8">{{ elcbInfo.description }}</p>
    </div>

    <!-- 接地工事・絶縁抵抗 判定カード -->
    <div class="section-card mt-12">
      <div class="card-header">
        <span class="card-title">⚡ 接地工事・絶縁抵抗 判定結果</span>
        <span class="badge" :class="groundingInfo.groundType === 'C種接地工事' ? 'badge-danger' : 'badge-primary'">
          {{ groundingInfo.groundType }}
        </span>
      </div>

      <div class="responsive-grid grid-3">
        <div class="grid-item">
          <span class="grid-label">接地抵抗値</span>
          <span class="grid-value">{{ groundingInfo.groundResistance }} Ω 以下</span>
          <span class="grid-sub">(ELCB設置時 {{ groundingInfo.allowableResistanceWithElcb }}Ω)</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">必要絶縁抵抗値</span>
          <span class="grid-value highlight">{{ groundingInfo.insulationResistance }} MΩ 以上</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">接地線最小太さ</span>
          <span class="grid-value">{{ groundingInfo.groundWireDiameter }}</span>
        </div>
      </div>

      <div v-if="groundingInfo.notes.length" class="warning-box mt-8">
        <p v-for="(note, idx) in groundingInfo.notes" :key="idx" class="warning-text">
          ⚠️ {{ note }}
        </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useMotorCalc } from '@/composables/useMotorCalc';
import BreakerSelect from '@/components/BreakerSelect.vue';
import Selected1 from '@/components/selected1.vue'; // インポート追加

const {
  outputKw,
  voltage,
  powerFactor,
  targetPowerFactor,
  efficiency,
  environment,
  frequency,
  driveMode,
  breakerTypeMode,
  motorCount,
  otherLoadAmp,
  calculatedAmp,
  simpleAmp,
  totalLoadAmp,
  requiredWireAmp,
  breakerInfo,
  groundingInfo,
  elcbInfo,
  capacitorInfo,
  matchedCapacitors,
  setPreset,
} = useMotorCalc();
</script>

<style scoped>
/* スタイルはそのまま維持 */
.motor-calc-container {
  width: 100%;
  box-sizing: border-box;
}

.result-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 2px solid #38bdf8;
  border-radius: 16px;
  padding: 16px;
  color: #ffffff;
}

.main-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid #334155;
  padding-bottom: 12px;
}

.result-label {
  font-size: 13px;
  color: #38bdf8;
  font-weight: bold;
}

.result-value-group {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.result-value {
  font-size: 38px;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.1;
}

.result-unit {
  font-size: 20px;
  font-weight: bold;
  color: #94a3b8;
}

.sub-results {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
  text-align: center;
}

.sub-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #0f172a;
  padding: 10px 6px;
  border-radius: 8px;
}

.sub-title {
  font-size: 11px;
  color: #cbd5e1;
  line-height: 1.3rem;
}

.sub-value {
  font-size: 14px;
  font-weight: bold;
  color: #38bdf8;
  margin-top: 4px;
}

.section-card,
.form-card {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: bold;
  color: #f8fafc;
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}
.badge-primary { background-color: #0284c7; color: #ffffff; }
.badge-danger  { background-color: #e11d48; color: #ffffff; }
.badge-info    { background-color: #334155; color: #38bdf8; }
.badge-success { background-color: #15803d; color: #ffffff; }

.responsive-grid {
  display: grid;
  gap: 10px;
  background-color: #1e293b;
  padding: 12px;
  border-radius: 8px;
}

.grid-3 { grid-template-columns: repeat(3, 1fr); }

.grid-item {
  display: flex;
  flex-direction: column;
}

.grid-label { 
  font-size: 11px;
  color: #cbd5e1;
  font-weight: 500;
}
.grid-value { 
  font-size: 15px;
  font-weight: bold; 
  color: #38bdf8; 
  margin-top: 2px; 
}
.grid-value.highlight { color: #4ade80; }
.grid-sub { 
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.description-text {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 0;
}

.warning-box {
  background-color: #451a03;
  border: 1px solid #b45309;
  border-radius: 8px;
  padding: 10px 12px;
}

.warning-text {
  font-size: 12px;
  color: #fde047;
  margin: 0;
  line-height: 1.5;
}

.sub-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.text-input,
.select-input {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #334155;
  color: #ffffff;
  font-size: 16px;
  box-sizing: border-box;
}

.text-input-readonly {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #38bdf8;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.chip-btn {
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s ease;
}

.chip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chip-btn.active,
.chip-btn:active:not(:disabled) {
  background-color: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}

.catalog-match-box {
  background-color: #1e293b;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #334155;
}

.catalog-table-wrapper {
  overflow-x: auto;
}

.catalog-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.catalog-table th {
  background-color: #0f172a;
  color: #cbd5e1;
  padding: 8px 10px;
  border-bottom: 1px solid #475569;
  white-space: nowrap;
}

.catalog-table td {
  padding: 10px;
  border-bottom: 1px solid #334155;
  color: #f8fafc;
  white-space: nowrap;
}

.catalog-table .mfr-name {
  font-weight: bold;
  color: #38bdf8;
}

.catalog-table .part-no {
  font-family: monospace;
  font-weight: bold;
  color: #4ade80;
}

.mb-8  { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px; }
.mt-8  { margin-top: 8px; }
.mt-12 { margin-top: 12px; }

@media (max-width: 640px) {
  .sub-results {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .grid-3 {
    grid-template-columns: 1fr;
  }

  .sub-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
  }

  .sub-value {
    margin-top: 0;
    font-size: 15px;
  }

  .grid-item {
    padding: 4px 0;
  }

  .grid-value {
    font-size: 16px;
  }

  .result-value {
    font-size: 34px;
  }
}
</style>