<template>
  <div class="home-container">
    <!-- 3モード切り替えタブ -->
    <div class="mode-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'normal' }"
        @click="currentMode = 'normal'"
      >
        許容配線長
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'reversed' }"
        @click="currentMode = 'reversed'"
      >
        距離固定 逆算
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'motor' }"
        @click="currentMode = 'motor'"
      >
        電動機 電流計算
      </button>
    </div>

    <!-- モード1: 許容配線長 算出 -->
    <div v-if="currentMode === 'normal'">
      <ResultCard :max-len="maxLen" :is-over-current="isOverCurrent" />

      <div class="form-card">
        <CablingSelect v-model="selectedSystemId" />

        <EquipmentSelect
          v-model:inputMode="inputMode"
          v-model:unitWatt="unitWatt"
          v-model:unitCount="unitCount"
          v-model:customDeviceAmp="customDeviceAmp"
          v-model:breakerAmp="breakerAmp"
        />

        <WireTypeSelect v-model="selectedCableId" @change="openSizePicker" />

        <WireSizeSelect
          v-model:selectedWireName="selectedWireName"
          :is-open="isSizePickerOpen"
          @open="openSizePicker"
          @close="closeSizePicker"
        />

        <div class="row-inputs mt-12">
          <div class="input-group">
            <label class="sub-label">電源電圧</label>
            <div class="voltage-toggle">
              <button
                type="button"
                class="volt-btn"
                :class="{ active: voltage === 100 }"
                @click="voltage = 100"
              >
                100V
              </button>
              <button
                type="button"
                class="volt-btn"
                :class="{ active: voltage === 200 }"
                @click="voltage = 200"
              >
                200V
              </button>
            </div>
          </div>
          <div class="input-group">
            <label class="sub-label">目標降下率 (%)</label>
            <input
              v-model.number="targetPercent"
              type="number"
              step="0.1"
              class="text-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- モード2: 距離固定 逆算選定 -->
    <div v-else-if="currentMode === 'reversed'" class="reversed-mode-wrapper">
      <div class="form-card">
        <!-- 回路電圧・許容電圧降下率 -->
        <div class="row-inputs">
          <div class="input-group">
            <label class="sub-label">回路電圧</label>
            <div class="voltage-toggle">
              <button
                type="button"
                class="volt-btn"
                :class="{ active: voltage === 100 }"
                @click="voltage = 100"
              >
                100V
              </button>
              <button
                type="button"
                class="volt-btn"
                :class="{ active: voltage === 200 }"
                @click="voltage = 200"
              >
                200V
              </button>
            </div>
          </div>
          <div class="input-group">
            <label class="sub-label">許容電圧降下率 (%)</label>
            <input
              v-model.number="targetPercent"
              type="number"
              step="0.1"
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
              <option value="VV">VVF / VVR (60℃)</option>
              <option value="IV">IV (60℃)</option>
              <option value="CV">CV / CVT (90℃)</option>
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
              class="text-input"
            />
          </div>

          <!-- 電流直接入力 -->
          <div v-if="loadType === 'motor' || calcInputMode === 'amp'" class="input-group">
            <label class="sub-label">負荷電流 I (A)</label>
            <input
              v-model.number="loadCurrent"
              type="number"
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
            <label class="sub-label">消費電力 (W)</label>
            <input
              v-model.number="loadWatt"
              type="number"
              step="100"
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
              step="0.01"
              min="0"
              max="1"
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
            <input v-model="ignorePowerFactor" type="checkbox" />
            <span>LED照明・純抵抗扱い (力率1.0・リアクタンス無視)</span>
          </label>
          <label v-if="loadType === 'general'" class="checkbox-label mt-8">
            <input v-model="isContinuous" type="checkbox" />
            <span>3時間以上の連続負荷 (1.25倍則適用)</span>
          </label>
        </div>
      </div>

      <!-- 結果コンポーネントへの連携 -->
      <ReversedResult
        :voltage="voltage"
        :target-percent="targetPercent"
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

    <!-- モード3: 電動機 電流計算 -->
    <MotorCalc v-else-if="currentMode === 'motor'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  AppMode,
  CalculationInputMode,
  LoadType,
  InstallationType,
  CableTypeCode,
  SYSTEM_DEFINITIONS,
  MOTOR_SPECS,
  CABLE_TYPES,
  WIRE_SIZES
} from '@/types/appDefinitions'

import { useCabling } from '@/composables/useCabling'
import { useEquipment } from '@/composables/useEquipment'
import { useWire } from '@/composables/useWire'
import { useWireSize } from '@/composables/useWireSize'

import CablingSelect from '@/components/CablingSelect.vue'
import EquipmentSelect from '@/components/EquipmentSelect.vue'
import WireTypeSelect from '@/components/WireTypeSelect.vue'
import WireSizeSelect from '@/components/WireSizeSelect.vue'
import ResultCard from '@/components/ResultCard.vue'
import ReversedResult from '@/components/ReversedResult.vue'
import MotorCalc from '@/components/MotorCalc.vue'

// UIモード設定
const currentMode = ref<AppMode>('normal')

// 共通設定
const voltage = ref<number>(100)
const targetPercent = ref<number>(2.0)

// モード1 (許容配線長) 用コンポーザブル
const { selectedSystemId } = useCabling()
const { inputMode, unitWatt, unitCount, customDeviceAmp, breakerAmp, totalI } =
  useEquipment(voltage)
const { selectedCableId } = useWire()
const { selectedWireName, isSizePickerOpen, openSizePicker, closeSizePicker } =
  useWireSize()

const currentSystem = computed(
  () =>
    SYSTEM_DEFINITIONS.find((s) => s.id === selectedSystemId.value) || SYSTEM_DEFINITIONS[0]
)
const currentCable = computed(
  () =>
    CABLE_TYPES.find((c) => c.id === selectedCableId.value) || CABLE_TYPES[0]
)
const currentWire = computed(
  () =>
    WIRE_SIZES.find((w) => w.name === selectedWireName.value) || WIRE_SIZES[0]
)

const allowDropV = computed(() => voltage.value * (targetPercent.value / 100))
const maxLen = computed(() => {
  const k = currentSystem.value.k
  const area = currentWire.value.area
  const i = totalI.value
  return k > 0 && i > 0 ? (allowDropV.value * 1000 * area) / (k * i) : 0
})
const maxLimit = computed(
  () => currentCable.value.limits[currentWire.value.name] || 999
)
const isOverCurrent = computed(() => totalI.value > maxLimit.value)

// モード2 (逆算選定) 用リアクティブ状態
const selectedReversedSystemId = ref<string>('1P2W')
const selectedCableType = ref<CableTypeCode>('VV')
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
    voltage.value = sys.defaultVoltage
  }
}

// 負荷種別変更時の動作制御
const handleLoadTypeChange = () => {
  if (loadType.value === 'motor') {
    selectedReversedSystemId.value = '3P3W'
    voltage.value = 200
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
.home-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 12px 16px 32px 16px;
  background-color: #1e293b;
  min-height: 100vh;
  box-sizing: border-box;
}

.mode-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 10px 4px;
  border-radius: 10px;
  border: 1px solid #475569;
  background-color: #0f172a;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.tab-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}

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
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}

.voltage-toggle,
.segmented-control {
  display: flex;
  background-color: #334155;
  border-radius: 8px;
  padding: 3px;
  border: 1px solid #475569;
}

.volt-btn,
.segment-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

.volt-btn.active,
.segment-btn.active {
  background-color: #0284c7;
  color: #ffffff;
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

.text-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-chips {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.chip-btn {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #38bdf8;
  cursor: pointer;
}

.row-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
  gap: 8px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
}
</style>