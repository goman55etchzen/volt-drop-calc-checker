<!-- src/components/MotorCalc.vue -->
<template>
  <div class="motor-calc-container">
    
    <!-- 入力フォームカード -->
    <div class="form-card mb-12">
      <div class="card-header">
        <span class="card-title">⚙️ 電動機仕様・入力設定</span>
      </div>

      <!-- 電動機定格出力 (kW) : ドラム式スムーズスワイパー -->
      <div class="input-group">
        <label class="sub-label">電動機定格出力 (kW)</label>
        <div class="drum-swiper-container" ref="drumContainerRef">
          <div class="drum-track">
            <div
              v-for="kw in [0.2, 0.4, 0.75, 1.5, 2.2, 3.7, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55]"
              :key="kw"
              :ref="(el) => setKwItemRef(el, kw)"
              class="drum-item"
              :class="{ active: outputKw === kw }"
              @click="outputKw = kw"
            >
              <span class="drum-value">{{ kw }}</span>
              <span class="drum-unit">kW</span>
            </div>
          </div>
        </div>
        <!-- 微調整用数値ダイレクト入力も併設 -->
        <div class="mt-8 flex items-center gap-8">
          <input
            v-model.number="outputKw"
            type="number"
            step="0.1"
            min="0.1"
            class="text-input"
            placeholder="直接入力も可能"
          />
        </div>
      </div>

      <!-- 電動機台数・その他一般負荷 (2カラム) -->
      <div class="responsive-grid grid-2 mt-12">
        
        <!-- 電動機台数 (無限ループ・ドラム式対応) -->
        <div class="input-group">
          <div class="flex justify-between items-center mb-1">
            <label class="sub-label mb-0">電動機台数</label>
            <div class="flex gap-1">
              <button type="button" class="drum-arrow-btn" @click="motorCountDrum.prev()">◀</button>
              <button type="button" class="drum-arrow-btn" @click="motorCountDrum.next()">▶</button>
            </div>
          </div>
          <div class="drum-compact-container">
            <div
              v-for="cnt in motorCountOptions"
              :key="cnt"
              class="drum-compact-item"
              :class="{ active: motorCount === cnt }"
              @click="motorCount = cnt"
            >
              {{ cnt }}台
            </div>
          </div>
          <input
            v-model.number="motorCount"
            type="number"
            min="1"
            step="1"
            class="text-input mt-2"
            placeholder="直接入力"
          />
        </div>

        <!-- その他一般負荷 Ir (A または W/kW 換算対応) -->
        <div class="input-group">
          <div class="flex justify-between items-center mb-1">
            <label class="sub-label mb-0">その他一般負荷 Ir</label>
            <div class="flex gap-1 text-xs">
              <button 
                type="button" 
                class="mode-switch-btn" 
                :class="{ active: loadInputMode === 'A' }" 
                @click="loadInputMode = 'A'"
              >A</button>
              <button 
                type="button" 
                class="mode-switch-btn" 
                :class="{ active: loadInputMode === 'W' }" 
                @click="loadInputMode = 'W'"
              >W/kW</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="rawLoadValue"
              type="number"
              min="0"
              step="0.1"
              :placeholder="loadInputMode === 'A' ? '0 A' : '0 W (or kW)'"
              class="text-input"
            />
          </div>
          <div class="text-xs text-sky-400 mt-2">
            換算値: <span class="font-bold">{{ otherLoadAmp.toFixed(1) }} A</span>
          </div>
        </div>

      </div>

      <!-- 電圧・周波数・環境条件 (独立トグル付きSelected1コンポーネント) -->
      <Selected1
        v-model:voltage="voltage"
        v-model:frequency="frequency"
        v-model:environment="environment"
        class="mt-12"
      />

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

      <!-- 総合値と個別・台数を完全に区別したグリッド配置 -->
      <div class="responsive-grid grid-3">
        
        <!-- 1. 総合値エリア（システム全体の総容量） -->
        <div class="grid-item highlight-box-total">
          <span class="grid-label">⚡ 総合値（システム総容量）</span>
          <span class="grid-value text-cyan">
            {{ (Number(capacitorInfo.recommendedKvar) * motorCount).toFixed(2) }} <span class="text-sm font-normal">kvar</span>
          </span>
          <span class="grid-sub">（総必要計算値: {{ (Number(capacitorInfo.requiredKvar) * motorCount).toFixed(2) }} kvar）</span>
        </div>

        <!-- 2. 個別・必要台数エリア -->
        <div class="grid-item highlight-box-unit">
          <span class="grid-label">📐 各モータあたりの個別仕様</span>
          <span class="grid-value text-green">
            {{ capacitorInfo.recommendedMicroFarad ?? '-' }} <span class="text-sm font-normal">μF / 台</span>
          </span>
          <span class="grid-sub">推奨台数: <strong class="text-white underline">{{ capacitorInfo.motorCount }} 台</strong> （各モータ毎に1台）</span>
        </div>

        <!-- 3. 備考・注意事項 -->
        <div class="grid-item">
          <span class="grid-label">📝 接続・設置備考</span>
          <p class="description-text mt-1">{{ capacitorInfo.dischargeResistorNote }}</p>
        </div>

      </div>

      <!-- 適合メーカー同等品・外形寸法一覧 -->
      <div v-if="driveMode !== 'inverter' && matchedCapacitors.length > 0" class="catalog-match-box mt-12">
        <div class="sub-label mb-8">
          🔍 適合メーカー同等品・外形寸法一覧 
          <span class="text-xs text-slate-400 font-normal">（※1台あたり {{ capacitorInfo.recommendedMicroFarad }} μF 品を選定）</span>
        </div>
        <div class="catalog-table-wrapper">
          <table class="catalog-table">
            <thead>
              <tr>
                <th>メーカー</th>
                <th>型番</th>
                <th>容量 (1台分)</th>
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

    <!-- 合算定格電流スライドインカード（独立コンポーネント） -->
    <IrSectionCard
      v-model:isOpen="isTotalAmpOpen"
      :display-total-load-amp="displayTotalLoadAmp"
      :calculated-amp="calculatedAmp"
      :motor-count="motorCount"
      :other-load-amp="otherLoadAmp"
    />

    <!-- 力率・効率 詳細設定スライドインカード（独立コンポーネント） -->
    <CapacitorSectionCard
      v-model:isOpen="isPowerFactorOpen"
      v-model:powerFactor="powerFactor"
      v-model:targetPowerFactor="targetPowerFactor"
      v-model:efficiency="efficiency"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { useMotorCalc } from '@/composables/useMotorCalc';
import { useDrum } from '@/composables/useDrum';
import BreakerSelect from '@/components/Motor/BreakerSelect.vue';
import Selected1 from '@/components/Motor/selected1.vue';
import IrSectionCard from '@/components/Motor/IrSectionCard.vue';
import CapacitorSectionCard from '@/components/Motor/CapacitorSectionCard.vue';

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
} = useMotorCalc();

// --- 初期カーソル位置を 2.2 kW に指定 ---
if (outputKw.value === 5.5) { // デフォルトがもし5.5等であれば 2.2 に初期化
  outputKw.value = 2.2;
}

// --- 横スクロール要素の参照管理用 ---
const drumContainerRef = ref<HTMLElement | null>(null);
const kwItemRefs = new Map<number, HTMLElement>();

const setKwItemRef = (el: any, kw: number) => {
  if (el) {
    kwItemRefs.set(kw, el);
  }
};

// 起動時（マウント時）に初期選択位置へ自動スクロール
onMounted(async () => {
  await nextTick();
  const targetEl = kwItemRefs.get(outputKw.value);
  if (targetEl && drumContainerRef.value) {
    targetEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
});

// --- スライドカードの開閉状態 ---
const isTotalAmpOpen = ref(false);
const isPowerFactorOpen = ref(false);

// --- 1. 電動機台数ドラム・無限ループ連携 ---
const motorCountOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const motorCountDrum = useDrum(motorCountOptions, motorCount.value);

watch(motorCountDrum.selectedValue, (newVal) => {
  motorCount.value = newVal;
});
watch(motorCount, (newVal) => {
  if (motorCountOptions.includes(newVal)) {
    motorCountDrum.selectValue(newVal);
  }
});

// --- 2. その他一般負荷の W / A 換算ロジック ---
const loadInputMode = ref<'A' | 'W'>('A');
const rawLoadValue = ref<number>(0);

watch([rawLoadValue, loadInputMode, voltage], ([val, mode]) => {
  if (mode === 'A') {
    otherLoadAmp.value = val || 0;
  } else {
    const v = voltage.value || 200;
    const powerWatts = val || 0;
    const currentA = powerWatts / (1.732 * v * 0.8);
    otherLoadAmp.value = Number(currentA.toFixed(2));
  }
});

// --- 3. 合算定格電流の滑らかなリアルタイム表示アニメーション ---
const displayTotalLoadAmp = ref(totalLoadAmp.value);
watch(totalLoadAmp, (newVal) => {
  const startVal = displayTotalLoadAmp.value;
  const diff = newVal - startVal;
  const duration = 250; // ms
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    if (elapsed < duration) {
      displayTotalLoadAmp.value = Number((startVal + diff * (elapsed / duration)).toFixed(2));
      requestAnimationFrame(animate);
    } else {
      displayTotalLoadAmp.value = newVal;
    }
  };
  requestAnimationFrame(animate);
});
</script>

<style scoped>
/* スタイル定義は既存を継続 */
.motor-calc-container {
  width: 100%;
  box-sizing: border-box;
}

.drum-swiper-container {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  background-color: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 8px;
  scrollbar-width: thin;
  scrollbar-color: #38bdf8 #1e293b;
  -webkit-overflow-scrolling: touch;
}

.drum-swiper-container::-webkit-scrollbar {
  height: 6px;
}
.drum-swiper-container::-webkit-scrollbar-thumb {
  background-color: #38bdf8;
  border-radius: 3px;
}

.drum-track {
  display: inline-flex;
  gap: 8px;
}

.drum-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 56px;
  background-color: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.drum-item.active {
  background-color: #0284c7;
  border-color: #38bdf8;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
  transform: scale(1.03);
}

.drum-value {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}

.drum-unit {
  font-size: 11px;
  color: #cbd5e1;
}

.drum-compact-container {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  background-color: #1e293b;
  padding: 4px;
  border: 1px solid #475569;
  border-radius: 6px;
}
.drum-compact-item {
  flex: 1;
  text-align: center;
  padding: 6px 2px;
  font-size: 12px;
  font-weight: bold;
  background-color: #334155;
  color: #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.drum-compact-item.active {
  background-color: #0284c7;
  color: #ffffff;
}

.drum-arrow-btn {
  background: #334155;
  border: 1px solid #475569;
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
}
.drum-arrow-btn:active {
  background: #0284c7;
  color: #fff;
}

.mode-switch-btn {
  background: #334155;
  border: 1px solid #475569;
  color: #cbd5e1;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.mode-switch-btn.active {
  background: #0284c7;
  color: #fff;
  border-color: #38bdf8;
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

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

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

/* 総合値と個別仕様を色分けして視覚的に区別するスタイル */
.highlight-box-total {
  background-color: rgba(2, 132, 199, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 6px;
  padding: 8px;
}

.highlight-box-unit {
  background-color: rgba(21, 128, 61, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.4);
  border-radius: 6px;
  padding: 8px;
}

.text-cyan { color: #38bdf8 !important; }
.text-green { color: #4ade80 !important; }

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

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .grid-3 {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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