<!-- src/common/Home.vue -->

<template>
  <div class="home-container">
    <!-- ==========================================
         モード切り替え
         ========================================== -->

    <div class="mode-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{
          active: currentMode === 'normal',
        }"
        @click="currentMode = 'normal'"
      >
        許容配線長
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{
          active: currentMode === 'aircon',
        }"
        @click="currentMode = 'aircon'"
      >
        エアコン選定
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{
          active: currentMode === 'reversed',
        }"
        @click="currentMode = 'reversed'"
      >
        距離固定 逆算
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{
          active: currentMode === 'motor',
        }"
        @click="currentMode = 'motor'"
      >
        電動機 電流計算
      </button>
    </div>

    <!-- ==========================================
         モード1
         ========================================== -->

    <div v-if="currentMode === 'normal'" class="layout-grid">
      <div class="result-column">
        <ResultCard :max-len="maxLen" :is-over-current="isOverCurrent" />
      </div>

      <div class="form-column">
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
            :selected-cable-id="selectedCableId"
            :is-open="isSizePickerOpen"
            @open="openSizePicker"
            @close="closeSizePicker"
          />

          <div class="row-inputs mt-12">
            <!-- 電圧 -->

            <div class="input-group">
              <label class="sub-label"> 電源電圧 </label>

              <div class="voltage-toggle">
                <button
                  type="button"
                  class="volt-btn"
                  :class="{
                    active: voltage === 100,
                  }"
                  @click="voltage = 100"
                >
                  100V
                </button>

                <button
                  type="button"
                  class="volt-btn"
                  :class="{
                    active: voltage === 200,
                  }"
                  @click="voltage = 200"
                >
                  200V
                </button>
              </div>
            </div>

            <!-- 降下率 -->

            <div class="input-group">
              <label class="sub-label"> 目標降下率 (%) </label>

              <input
                v-model.number="targetPercent"
                type="number"
                inputmode="decimal"
                step="0.1"
                placeholder="例: 2.0"
                class="text-input"
              />
            </div>
          </div>

          <!-- ======================================
               エアコン連携表示
               ====================================== -->

          <div v-if="isAirconPrefilled" class="aircon-prefilled-notice">
            <div class="aircon-prefilled-title">エアコン選定結果を反映中</div>

            <div class="aircon-prefilled-text">
              電圧
              {{ voltage }}V / 配線計算電流 {{ customDeviceAmp }}A / 電線
              {{ selectedWireName }}
              <template v-if="selectedRatedCurrentA !== null">
                / 定格
                {{ selectedRatedCurrentA }}A
              </template>
              <template v-if="selectedMaxCurrentA !== null">
                / 最大
                {{ selectedMaxCurrentA }}A
              </template>
              / ブレーカー
              {{ breakerAmp }}A
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==========================================
         モード2
         ========================================== -->

    <AirConditioner
      v-else-if="currentMode === 'aircon'"
      @select-cable="handleAirconCableSelect"
    />

    <!-- ==========================================
         モード3
         ========================================== -->

    <ReversedMode
      v-else-if="currentMode === 'reversed'"
      v-model:voltage="voltage"
      v-model:targetPercent="targetPercent"
    />

    <!-- ==========================================
         モード4
         ========================================== -->

    <MotorCalc v-else-if="currentMode === 'motor'" />

    <Caution />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
} from 'vue'

import type {
  AppMode,
  CableTypeCode,
} from '@/types/appDefinitions'

import type {
  AirconCableSelectionPayload,
} from '@/composables/useAirconCable'

import {
  useCabling,
} from '@/composables/useCabling'

import {
  useEquipment,
} from '@/composables/useEquipment'

import {
  useWire,
} from '@/composables/useWire'

import {
  useWireSize,
} from '@/composables/useWireSize'

import CablingSelect from '@/components/cable/CablingSelect.vue'
import EquipmentSelect from '@/components/Motor/EquipmentSelect.vue'
import WireTypeSelect from '@/components/cable/WireTypeSelect.vue'
import WireSizeSelect from '@/components/cable/WireSizeSelect.vue'
import ResultCard from '@/components/ResultCard.vue'
import ReversedMode from '@/components/ReversedInputForm.vue'
import MotorCalc from '@/components/Motor/MotorCalc.vue'
import AirConditioner from '@/components/AC/AirConditioner.vue'
import Caution from '@/components/common/Caution.vue'

// ==========================================
// Mode
// ==========================================

type ExtendedAppMode =
  | AppMode
  | 'aircon'

const currentMode =
  ref<ExtendedAppMode>(
    'normal'
  )

// ==========================================
// 配線条件
// ==========================================

const voltage =
  ref<number>(100)

const targetPercent =
  ref<number>(2.0)

// ==========================================
// 設備
// ==========================================

const {
  inputMode,
  unitWatt,
  unitCount,
  customDeviceAmp,
  breakerAmp,

  selectedWireSize:
    equipmentWireSize,

  selectedCableType:
    equipmentCableType,

  selectedMaxCurrentA,
  selectedRatedCurrentA,

  totalI,
  applyAirconSelection,
} = useEquipment(
  voltage
)

// ==========================================
// 電線
// ==========================================

const {
  selectedCableId,
} = useWire()

const {
  selectedWireName,
  isSizePickerOpen,
  openSizePicker,
  closeSizePicker,
} = useWireSize()

// ==========================================
// 配線計算
// ==========================================

const {
  selectedSystemId,
  maxLen,
  isOverCurrent,
} = useCabling(
  voltage,
  totalI,
  selectedWireName,
  selectedCableId,
  targetPercent
)

// ==========================================
// エアコン連携状態
// ==========================================

const isAirconPrefilled =
  ref<boolean>(false)

// ==========================================
// エアコン入力モード判定
// ==========================================

const isAirconInputMode =
  computed(() => {
    return (
      inputMode.value ===
      'device_amp'
    )
  })

// ==========================================
// エアコン選定結果を配線計算へ反映
// ==========================================

const handleAirconCableSelect =
  (
    payload:
      AirconCableSelectionPayload
  ) => {

    // ----------------------------------------
    // ★一括適用
    //
    // currentA は useAirconCable 側で
    // maxCurrentA が入っている。
    // ----------------------------------------

    applyAirconSelection({
      cableType:
        payload.cableType,

      wireSize:
        payload.wireSize,

      voltage:
        payload.voltage,

      currentA:
        payload.currentA,

      ratedCurrentA:
        payload.ratedCurrentA,

      maxCurrentA:
        payload.maxCurrentA,

      breakerAmp:
        payload.breakerAmp,

      breakerPoles:
        payload.breakerPoles,

      capacityKw:
        payload.capacityKw,

      tatamiStandard:
        payload.tatamiStandard,
    })

    // ----------------------------------------
    // useEquipment と useWire の状態を同期
    // ----------------------------------------

    selectedCableId.value =
      payload.cableType

    selectedWireName.value =
      payload.wireSize

    // ----------------------------------------
    // 連携済み
    // ----------------------------------------

    isAirconPrefilled.value =
      true

    // ----------------------------------------
    // 許容配線長へ移動
    // ----------------------------------------

    currentMode.value =
      'normal'
  };
</script>

<style scoped>
.home-container {
  width: 100%;
  /* スマホ版の標準サイズ */
  max-width: 500px; 
  margin: 0 auto;
  padding: 12px 12px 40px 12px;
  background-color: #1e293b;
  min-height: 100vh;
  box-sizing: border-box;
}

/* タブボタンのコンテナ幅も揃える */
.mode-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  width: 100%;
}

/* PC版 (768px 以上 または 1024px 以上) */
@media (min-width: 1024px) {
  .home-container {
    /* PC版で全モード共通とする最大幅（必要に応じて900px〜1000pxに統一） */
    max-width: 960px; 
    padding: 24px 32px 60px;
  }

  .mode-tabs {
    gap: 12px;
    margin-bottom: 24px;
    max-width: 100%; /* タブも全体幅に拡張 */
  }
}

@media (min-width: 1024px) {
  .mode-tabs {
    gap: 16px;
    margin-bottom: 24px;
    max-width: 720px;
  }
}

.tab-btn {
  flex: 1;
  min-height: 44px;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid #475569;
  background-color: #0f172a;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

@media (min-width: 1024px) {
  .tab-btn {
    min-height: 52px;
    font-size: 15px;
  }

  .tab-btn:hover {
    border-color: #38bdf8;
    color: #f8fafc;
  }
}

.tab-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}

.layout-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 1024px) {
  .layout-grid {
    flex-direction: row;
    align-items: flex-start;
    gap: 32px;
  }

  .form-column {
    order: 1;
    flex: 1;
    max-width: 650px;
  }

  .result-column {
    order: 2;
    width: 400px;
    flex-shrink: 0;
    position: sticky;
    top: 24px;
  }
}

.form-card {
  background-color: #0f172a;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #334155;
}

@media (min-width: 1024px) {
  .form-card {
    padding: 28px;
  }
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

@media (min-width: 1024px) {
  .sub-label {
    font-size: 14px;
  }
}

.voltage-toggle {
  display: flex;
  background-color: #334155;
  border-radius: 10px;
  padding: 3px;
  border: 1px solid #475569;
  min-height: 48px;
  box-sizing: border-box;
}

.volt-btn {
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
  transition: all 0.2s ease;
}

.volt-btn.active {
  background-color: #0284c7;
  color: #ffffff;
}

.text-input {
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
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: #38bdf8;
}

.text-input::placeholder {
  color: #64748b;
  font-size: 14px;
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

@media (min-width: 1024px) {
  .row-inputs {
    gap: 20px;
  }

  .text-input {
    min-height: 52px;
  }
}

.aircon-prefilled-notice {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #0284c7;
  background: rgba(2, 132, 199, 0.12);
}

.aircon-prefilled-title {
  color: #38bdf8;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 4px;
}

.aircon-prefilled-text {
  color: #cbd5e1;
  font-size: 12px;
  line-height: 1.5;
}

.mt-12 {
  margin-top: 12px;
}
</style>
