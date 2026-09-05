<template>
  <div class="field-group">
    <label class="label">2. 使用予定の設備・負荷（流れる電流の決定）</label>
    <select v-model="inputMode" class="select-input mb-2">
      <option value="device_watt">電球 W数×台数 から算出</option>
      <option value="device_amp">設備電流 (A) を直接指定</option>
      <option value="breaker_limit">ブレーカー容量 から指定</option>
    </select>

    <div v-if="inputMode === 'device_watt'" class="grid-2">
      <div>
        <label class="sub-label">1台あたりの消費電力(W)</label>
        <input v-model.number="unitWatt" type="number" class="text-input" />
      </div>
      <div>
        <label class="sub-label">設置台数 (台)</label>
        <input v-model.number="unitCount" type="number" class="text-input" />
      </div>
    </div>

    <div v-if="inputMode === 'device_amp'">
      <label class="sub-label">合計消費電流 (A)</label>
      <input
        v-model.number="customDeviceAmp"
        type="number"
        class="text-input"
      />
    </div>

    <div v-if="inputMode === 'breaker_limit'">
      <label class="sub-label">ブレーカー容量 (A)</label>
      <input v-model.number="breakerAmp" type="number" class="text-input" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { InputMode } from '../composables/useEquipment';

const inputMode = defineModel<InputMode>('inputMode', { required: true });
const unitWatt = defineModel<number>('unitWatt', { required: true });
const unitCount = defineModel<number>('unitCount', { required: true });
const customDeviceAmp = defineModel<number>('customDeviceAmp', {
  required: true,
});
const breakerAmp = defineModel<number>('breakerAmp', { required: true });
</script>

<style scoped>
.field-group {
  margin-bottom: 16px;
}
.label {
  display: block;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 6px;
  color: #334155;
}
.sub-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
  display: block;
}
.select-input,
.text-input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  box-sizing: border-box;
}
.mb-2 {
  margin-bottom: 8px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
</style>
