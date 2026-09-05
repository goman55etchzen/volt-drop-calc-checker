<template>
    <div class="home-container">
      <!-- 固定表示の結果カード -->
      <ResultCard :max-len="maxLen" :is-over-current="isOverCurrent" />
  
      <!-- 入力フォームカード -->
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
  
        <!-- 電圧・降下率設定 -->
        <div class="row-inputs">
          <div class="input-group">
            <label class="sub-label">電源電圧 (V)</label>
            <input v-model.number="voltage" type="number" class="text-input" />
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
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useCabling, SYSTEM_TYPES } from '../composables/useCabling'
  import { useEquipment } from '../composables/useEquipment'
  import { useWire, CABLE_TYPES } from '../composables/useWire'
  import { useWireSize, WIRE_SIZES } from '../composables/useWireSize'
  
  import CablingSelect from '../components/CablingSelect.vue'
  import EquipmentSelect from '../components/EquipmentSelect.vue'
  import WireTypeSelect from '../components/WireTypeSelect.vue'
  import WireSizeSelect from '../components/WireSizeSelect.vue'
  import ResultCard from '../components/ResultCard.vue'
  
  const voltage = ref<number>(100)
  const targetPercent = ref<number>(2.0)
  
  const { selectedSystemId } = useCabling()
  const { inputMode, unitWatt, unitCount, customDeviceAmp, breakerAmp, totalI } =
    useEquipment(voltage)
  const { selectedCableId } = useWire()
  const { selectedWireName, isSizePickerOpen, openSizePicker, closeSizePicker } =
    useWireSize()
  
  // システム・電線・サイズの参照設定
  const currentSystem = computed(
    () =>
      SYSTEM_TYPES.find((s) => s.id === selectedSystemId.value) || SYSTEM_TYPES[0]
  )
  const currentCable = computed(
    () =>
      CABLE_TYPES.find((c) => c.id === selectedCableId.value) || CABLE_TYPES[0]
  )
  const currentWire = computed(
    () =>
      WIRE_SIZES.find((w) => w.name === selectedWireName.value) || WIRE_SIZES[0]
  )
  
  // 許容電圧降下量 (V)
  const allowDropV = computed(() => voltage.value * (targetPercent.value / 100))
  
  // 許容配線長 (m) の算出（最末端集中負荷）
  const maxLen = computed(() => {
    const k = currentSystem.value.k
    const area = currentWire.value.area
    const i = totalI.value
    return k > 0 && i > 0 ? (allowDropV.value * 1000 * area) / (k * i) : 0
  })
  
  // 許容電流判定
  const maxLimit = computed(
    () => currentCable.value.limits[currentWire.value.name] || 999
  )
  const isOverCurrent = computed(() => totalI.value > maxLimit.value)
  </script>
  
  <style scoped>
  .home-container {
    max-width: 480px;
    margin: 0 auto;
    padding: 12px 16px 32px 16px;
    background-color: #1e293b; /* 背景色 */
    min-height: 100vh;
    box-sizing: border-box;
  }
  
  .form-card {
    background-color: #0f172a; /* フォームのベースカード色 */
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    border: 1px solid #334155;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
  }
  
  .sub-label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8; /* まぶしさを抑えたテキスト色 */
    margin-bottom: 6px;
  }
  
  .text-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #475569;
    background-color: #334155;
    color: #f8fafc;
    font-size: 15px;
    font-weight: 500;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s;
  }
  
  .text-input:focus {
    border-color: #38bdf8;
  }
  
  .row-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 8px;
  }
  </style>