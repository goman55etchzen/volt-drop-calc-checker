<template>
  <div class="motor-calc-container">
    <div class="result-card">
      <div class="main-result">
        <span class="result-label">計算定格電流</span>
        <div class="result-value-group">
          <span class="result-value">{{ calculatedAmp }}</span>
          <span class="result-unit">A</span>
        </div>
      </div>

      <div class="sub-results">
        <div class="sub-item">
          <span class="sub-title">簡易目安 (kW×{{ voltage === 400 ? 2 : 4 }})</span>
          <span class="sub-value">約 {{ simpleAmp }} A</span>
        </div>
        <div class="sub-item">
          <span class="sub-title">電線選定用 (1.25/1.1倍則)</span>
          <span class="sub-value">{{ requiredWireAmp }} A</span>
        </div>
        <div class="sub-item">
          <span class="sub-title">推奨ブレーカー (目安)</span>
          <span class="sub-value">{{ breakerCapacity.recommended }} A</span>
        </div>
      </div>
    </div>

    <div class="form-card mt-12">
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
          <button type="button" class="chip-btn" @click="setPreset(0.75)">0.75kW</button>
          <button type="button" class="chip-btn" @click="setPreset(2.2)">2.2kW</button>
          <button type="button" class="chip-btn" @click="setPreset(3.7)">3.7kW</button>
          <button type="button" class="chip-btn" @click="setPreset(5.5)">5.5kW</button>
          <button type="button" class="chip-btn" @click="setPreset(7.5)">7.5kW</button>
          <button type="button" class="chip-btn" @click="setPreset(11)">11kW</button>
        </div>
      </div>

      <div class="row-inputs mt-12">
        <div class="input-group">
          <label class="sub-label">線間電圧 (V)</label>
          <select v-model.number="voltage" class="select-input">
            <option :value="200">200 V</option>
            <option :value="220">220 V</option>
            <option :value="400">400 V</option>
            <option :value="440">440 V</option>
          </select>
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

      <div class="input-group mt-12">
        <label class="sub-label">力率 cosθ</label>
        <input
          v-model.number="powerFactor"
          type="number"
          step="0.01"
          min="0.5"
          max="1.0"
          class="text-input"
        />
      </div>
    </div>

    <div class="info-card mt-12">
      <p class="info-title">💡 判定・公式メモ</p>
      <ul class="info-list">
        <li><strong>定格電流式:</strong> I = P / (√3 × V × cosθ × η)</li>
        <li><strong>簡易目標:</strong> 200V時は出力(kW)の約4倍、400V時は約2倍が目安。</li>
        <li><strong>内線規程:</strong> 電線許容電流は 50A以下で1.25倍、50A超で1.1倍以上が必要。</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMotorCalc } from '@/composables/useMotorCalc';

const {
  outputKw,
  voltage,
  powerFactor,
  efficiency,
  calculatedAmp,
  simpleAmp,
  requiredWireAmp,
  breakerCapacity,
  setPreset,
} = useMotorCalc();
</script>

<style scoped>
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
  font-size: 12px;
  color: #38bdf8;
  font-weight: bold;
}

.result-value-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.result-value {
  font-size: 36px;
  font-weight: 800;
  color: #f8fafc;
}

.result-unit {
  font-size: 18px;
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
  background-color: #0f172a;
  padding: 8px 4px;
  border-radius: 8px;
}

.sub-title {
  font-size: 10px;
  color: #94a3b8;
}

.sub-value {
  font-size: 13px;
  font-weight: bold;
  color: #38bdf8;
  margin-top: 4px;
}

.form-card,
.info-card {
  background-color: #0f172a;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #334155;
}

.sub-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}

.text-input,
.select-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #334155;
  color: #f8fafc;
  font-size: 14px;
  box-sizing: border-box;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.chip-btn {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #38bdf8;
  cursor: pointer;
  font-weight: 600;
}

.row-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mt-12 {
  margin-top: 12px;
}

.info-title {
  font-size: 12px;
  font-weight: bold;
  color: #f8fafc;
  margin-bottom: 6px;
}

.info-list {
  padding-left: 16px;
  margin: 0;
  font-size: 11px;
  color: #cbd5e1;
  line-height: 1.6;
}
</style>