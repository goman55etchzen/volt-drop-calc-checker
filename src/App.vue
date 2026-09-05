<template>
  <div class="app-container">
    <!-- 最上部固定の結果カード（タイトルは削除） -->
    <ResultCard :max-len="maxLen" :is-over-current="isOverCurrent" />

    <!-- 入力フォームエリア -->
    <div class="form-content">
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

      <!-- 電圧・降下率 -->
      <div class="row-inputs">
        <div>
          <label class="sub-label">電源電圧 (V)</label>
          <input v-model.number="voltage" type="number" class="text-input" />
        </div>
        <div>
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
import { ref, computed } from 'vue';
import { useCabling, SYSTEM_TYPES } from './composables/useCabling';
import { useEquipment } from './composables/useEquipment';
import { useWire, CABLE_TYPES } from './composables/useWire';
import { useWireSize, WIRE_SIZES } from './composables/useWireSize';

import CablingSelect from './components/CablingSelect.vue';
import EquipmentSelect from './components/EquipmentSelect.vue';
import WireTypeSelect from './components/WireTypeSelect.vue';
import WireSizeSelect from './components/WireSizeSelect.vue';
import ResultCard from './components/ResultCard.vue';

const voltage = ref<number>(100);
const targetPercent = ref<number>(2.0);

const { selectedSystemId } = useCabling();
const { inputMode, unitWatt, unitCount, customDeviceAmp, breakerAmp, totalI } =
  useEquipment(voltage);
const { selectedCableId } = useWire();
const { selectedWireName, isSizePickerOpen, openSizePicker, closeSizePicker } =
  useWireSize();

// 計算結果算出
const currentSystem = computed(
  () =>
    SYSTEM_TYPES.find((s) => s.id === selectedSystemId.value) || SYSTEM_TYPES[0]
);
const currentCable = computed(
  () =>
    CABLE_TYPES.find((c) => c.id === selectedCableId.value) || CABLE_TYPES[0]
);
const currentWire = computed(
  () =>
    WIRE_SIZES.find((w) => w.name === selectedWireName.value) || WIRE_SIZES[0]
);

const allowDropV = computed(() => voltage.value * (targetPercent.value / 100));

// 常に最悪条件（全電流）で許容長さを算出
const maxLen = computed(() => {
  const k = currentSystem.value.k;
  const area = currentWire.value.area;
  const i = totalI.value;
  return k > 0 && i > 0 ? (allowDropV.value * 1000 * area) / (k * i) : 0;
});

const maxLimit = computed(
  () => currentCable.value.limits[currentWire.value.name] || 999
);
const isOverCurrent = computed(() => totalI.value > maxLimit.value);
</script>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  font-family: sans-serif;
  background: #f8fafc;
  min-height: 100vh;
  box-sizing: border-box;
}

.form-content {
  padding-top: 8px;
}

.sub-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
  display: block;
}

.text-input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  box-sizing: border-box;
}

.row-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 24px;
}
</style>
