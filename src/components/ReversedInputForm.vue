<template>
  <div class="reversed-mode-wrapper">
    <div class="form-card">
      <!-- 回路電圧・許容電圧降下率 -->
      <div class="row-inputs">
        <div class="input-group">
          <label class="sub-label">回路電圧</label>
          <div class="voltage-toggle">
            <button
              type="button"
              class="volt-btn"
              :class="{ active: localVoltage === 100 }"
              @click="localVoltage = 100"
            >
              100V
            </button>
            <button
              type="button"
              class="volt-btn"
              :class="{ active: localVoltage === 200 }"
              @click="localVoltage = 200"
            >
              200V
            </button>
          </div>
        </div>
        <div class="input-group">
          <label class="sub-label">許容電圧降下率 (%)</label>
          <input
            v-model.number="localTargetPercent"
            type="number"
            inputmode="decimal"
            step="0.1"
            placeholder="例: 2.0"
            class="text-input"
          />
        </div>
      </div>

      <!-- 配線方式＆電線種別 -->
      <div class="row-inputs mt-12">
        <div class="input-group">
          <label class="sub-label">配線方式</label>
          <select
            v-model="selectedReversedSystemId"
            class="select-input"
            @change="handleSystemChange"
          >
            <option
              v-for="sys in SYSTEM_DEFINITIONS"
              :key="sys.id"
              :value="sys.id"
            >
              {{ sys.label }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label class="sub-label">電線種別</label>
          <select v-model="selectedCableType" class="select-input">
            <option value="vv">VVF / VVR (60℃)</option>
            <option value="iv">IV (60℃)</option>
            <option value="cv">CV / CVT (90℃)</option>
          </select>
        </div>
      </div>

      <!-- 負荷種別切り替え -->
      <div class="input-group mt-12">
        <label class="sub-label">負荷種別</label>
        <select v-model="loadType" class="select-input" @change="handleLoadTypeChange">
          <option value="general">一般負荷 (照明・コンセント等)</option>
          <option value="motor">三相交流モーター (規約電流)</option>
        </select>
      </div>

      <!-- モーター出力選択 (モーター時) -->
      <div v-if="loadType === 'motor'" class="input-group mt-12">
        <label class="sub-label">モーター定格出力 (kW)</label>
        <select v-model.number="motorKw" class="select-input" @change="applyMotorAmp">
          <option v-for="m in MOTOR_SPECS" :key="m.kw" :value="m.kw">
            {{ m.kw }} kW (規約電流 {{ m.amp }}A)
          </option>
        </select>
      </div>

      <!-- 一般負荷時の指定モード選択 (A指定 / W指定) -->
      <div v-if="loadType === 'general'" class="input-group mt-12">
        <label class="sub-label">負荷入力モード</label>
        <div class="segmented-control">
          <button
            type="button"
            class="segment-btn"
            :class="{ active: calcInputMode === 'amp' }"
            @click="calcInputMode = 'amp'"
          >
            電流直接指定 (A)
          </button>
          <button
            type="button"
            class="segment-btn"
            :class="{ active: calcInputMode === 'watt' }"
            @click="calcInputMode = 'watt'"
          >
            消費電力指定 (W)
          </button>
        </div>
      </div>

      <!-- 片道距離＆負荷仕様入力 -->
      <div class="row-inputs mt-12">
        <div class="input-group">
          <label class="sub-label">片道こう長 L (m)</label>
          <input
            v-model.number="oneWayDistance"
            type="number"
            inputmode="decimal"
            placeholder="例: 30"
            class="text-input"
          />
        </div>

        <!-- 電流直接入力 -->
        <div v-if="loadType === 'motor' || calcInputMode === 'amp'" class="input-group">
          <label class="sub-label">負荷電流 I (A)</label>
          <input
            v-model.number="loadCurrent"
            type="number"
            inputmode="decimal"
            placeholder="例: 15"
            class="text-input"
            :readonly="loadType === 'motor'"
          />
          <div v-if="loadType === 'general'" class="preset-chips">
            <button type="button" class="chip-btn" @click="loadCurrent = 15">15A</button>
            <button type="button" class="chip-btn" @click="loadCurrent = 20">20A</button>
            <button type="button" class="chip-btn" @click="loadCurrent = 30">30A</button>
          </div>
        </div>

        <!-- 消費電力入力 -->
        <div v-else class="input-group">
          <label class="sub-label">回路の合計消費電力 (W)</label>
          <input
            v-model.number="loadWatt"
            type="number"
            inputmode="numeric"
            step="100"
            placeholder="接続機器合計Ｗ"
            class="text-input"
          />
        </div>
      </div>

      <!-- 力率＆敷設方式 -->
      <div class="row-inputs mt-12">
        <div class="input-group">
          <label class="sub-label">力率 cosθ</label>
          <input
            v-model.number="powerFactor"
            type="number"
            inputmode="decimal"
            step="0.01"
            min="0"
            max="1"
            placeholder="例: 0.85"
            class="text-input"
            :disabled="ignorePowerFactor"
          />
        </div>
        <div class="input-group">
          <label class="sub-label">敷設方式</label>
          <select v-model="installationType" class="select-input">
            <option value="conduit_3">配管収容 (3本以下) - 低減0.70</option>
            <option value="conduit_4">配管収容 (4本) - 低減0.63</option>
            <option value="ceiling_open">天井内ころがし / 架空 - 低減1.00</option>
            <option value="staple_surface">造営材支持 / ステップル - 低減0.85</option>
          </select>
        </div>
      </div>

      <!-- オプションチェックボックス -->
      <div class="checkbox-container mt-12">
        <label class="checkbox-label">
          <input v-model="ignorePowerFactor" type="checkbox" class="touch-checkbox" />
          <span>LED照明・純抵抗扱い (力率1.0・リアクタンス無視)</span>
        </label>
        <label v-if="loadType === 'general'" class="checkbox-label mt-8">
          <input v-model="isContinuous" type="checkbox" class="touch-checkbox" />
          <span>3時間以上の連続負荷 (1.25倍則適用)</span>
        </label>
      </div>
    </div>

    <!-- 結果コンポーネントへの連携 -->
    <ReversedResult
      :voltage="localVoltage"
      :target-percent="localTargetPercent"
      :input-mode="calcInputMode"
      :load-watt="loadWatt"
      :load-current="loadCurrent"
      :one-way-distance="oneWayDistance"
      :selected-system-id="selectedReversedSystemId"
      :selected-cable-type="selectedCableType"
      :power-factor="powerFactor"
      :ignore-power-factor="ignorePowerFactor"
      :load-type="loadType"
      :motor-kw="motorKw"
      :installation-type="installationType"
      :is-continuous="isContinuous"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CalculationInputMode,
  LoadType,
  InstallationType,
  CableTypeCode,
  SYSTEM_DEFINITIONS,
  MOTOR_SPECS
} from '@/types/appDefinitions'
import ReversedResult from '@/components/ReversedResult.vue'

// Home.vueと共有する状態（v-modelでバインド）
const props = defineProps<{
  voltage: number
  targetPercent: number
}>()

const emit = defineEmits<{
  (e: 'update:voltage', value: number): void
  (e: 'update:targetPercent', value: number): void
}>()

const localVoltage = computed({
  get: () => props.voltage,
  set: (val) => emit('update:voltage', val)
})

const localTargetPercent = computed({
  get: () => props.targetPercent,
  set: (val) => emit('update:targetPercent', val)
})

// モード2専用のリアクティブ状態
const selectedReversedSystemId = ref<string>('1P2W')
const selectedCableType = ref<CableTypeCode>('vv')
const calcInputMode = ref<CalculationInputMode>('amp')
const loadWatt = ref<number>(1500)
const loadCurrent = ref<number>(15)
const oneWayDistance = ref<number>(30)
const powerFactor = ref<number>(0.85)
const ignorePowerFactor = ref<boolean>(false)
const loadType = ref<LoadType>('general')
const motorKw = ref<number>(0.75)
const installationType = ref<InstallationType>('conduit_3')
const isContinuous = ref<boolean>(true)

// 配線方式変更時の電圧自動連動
const handleSystemChange = () => {
  const sys = SYSTEM_DEFINITIONS.find((s) => s.id === selectedReversedSystemId.value)
  if (sys) {
    localVoltage.value = sys.defaultVoltage
  }
}

// 負荷種別変更時の動作制御
const handleLoadTypeChange = () => {
  if (loadType.value === 'motor') {
    selectedReversedSystemId.value = '3P3W'
    localVoltage.value = 200
    ignorePowerFactor.value = false
    applyMotorAmp()
  } else {
    loadCurrent.value = 15
    powerFactor.value = 0.85
  }
}

// モーター出力変更時の規約電流・力率自動反映
const applyMotorAmp = () => {
  const spec = MOTOR_SPECS.find((m) => m.kw === motorKw.value)
  if (spec) {
    loadCurrent.value = spec.amp
    powerFactor.value = spec.defaultCosTheta
  }
}
</script>

<style scoped>
.form-card {
  background-color: #0f172a;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #334155;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.sub-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}

.voltage-toggle,
.segmented-control {
  display: flex;
  background-color: #334155;
  border-radius: 10px;
  padding: 3px;
  border: 1px solid #475569;
  min-height: 48px;
  box-sizing: border-box;
}

.volt-btn,
.segment-btn {
  flex: 1;
  min-height: 40px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.volt-btn.active,
.segment-btn.active {
  background-color: #0284c7;
  color: #ffffff;
}

.text-input,
.select-input {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #475569;
  background-color: #334155;
  color: #f8fafc;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
}

.text-input::placeholder {
  color: #64748b;
  font-size: 14px;
}

.text-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-chips {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.chip-btn {
  flex: 1;
  min-height: 38px;
  font-size: 13px;
  font-weight: bold;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #38bdf8;
  background-color: #0c4a6e;
  color: #38bdf8;
  cursor: pointer;
  touch-action: manipulation;
}

.row-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 360px) {
  .row-inputs {
    grid-template-columns: 1fr;
  }
}

.mt-8 {
  margin-top: 8px;
}

.mt-12 {
  margin-top: 12px;
}

.checkbox-container {
  display: flex;
  flex-direction: column;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px 0;
  touch-action: manipulation;
}

.touch-checkbox {
  width: 20px;
  height: 20px;
  accent-color: #0284c7;
}
</style>