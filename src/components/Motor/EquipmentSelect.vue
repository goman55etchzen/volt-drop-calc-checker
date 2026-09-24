<template>
  <div class="field-group">
    <label class="label">2. 使用予定の設備・負荷（流れる電流の決定）</label>
    <select v-model="inputMode" class="select-input mb-3">
      <option value="device_watt">電球 W数×台数 から算出</option>
      <option value="device_amp">設備電流 (A) を直接指定</option>
      <option value="breaker_limit">ブレーカー容量 から指定</option>
    </select>

    <div v-if="inputMode === 'device_watt'" class="grid-2">
      <div>
        <label class="sub-label">1台あたりの消費電力(W)</label>
        <input
          v-model.number="unitWatt"
          type="number"
          inputmode="numeric"
          class="text-input"
        />
      </div>
      <div>
        <label class="sub-label">設置台数 (台)</label>
        <input
          v-model.number="unitCount"
          type="number"
          inputmode="numeric"
          class="text-input"
        />
      </div>
    </div>

    <div v-if="inputMode === 'device_amp'">
      <label class="sub-label">合計消費電流 (A)</label>
      <input
        v-model.number="customDeviceAmp"
        type="number"
        inputmode="decimal"
        class="text-input"
      />
    </div>

    <div v-if="inputMode === 'breaker_limit'">
      <label class="sub-label">ブレーカー容量 (A)</label>
      <input
        v-model.number="breakerAmp"
        type="number"
        inputmode="decimal"
        class="text-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { EquipmentInputMode } from '@/types/appDefinitions';

const inputMode = defineModel<EquipmentInputMode>('inputMode', { required: true });
const unitWatt = defineModel<number>('unitWatt', { required: true });
const unitCount = defineModel<number>('unitCount', { required: true });
const customDeviceAmp = defineModel<number>('customDeviceAmp', {
  required: true,
});
const breakerAmp = defineModel<number>('breakerAmp', { required: true });
</script>

<style scoped>
.field-group {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #f8fafc;
}

.sub-label {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
  display: block;
}

.select-input,
.text-input {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #475569;
  font-size: 16px;
  background-color: #334155;
  color: #f8fafc;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.select-input:focus,
.text-input:focus {
  border-color: #38bdf8;
}

.mb-3 {
  margin-bottom: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 360px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

/* --- PC用レスポンシブ --- */
@media (min-width: 768px) {
  .field-group {
    padding: 24px;
    background-color: #1e293b;
    border-radius: 12px;
    border: 1px solid #334155;
  }
  .label {
    font-size: 16px;
    margin-bottom: 12px;
  }
  .grid-2 {
    gap: 24px;
  }
  .select-input,
  .text-input {
    font-size: 16px;
    min-height: 52px;
  }
}
</style>