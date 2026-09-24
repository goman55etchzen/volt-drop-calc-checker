<!-- src/components/cable/CablingSelect.vue -->
<template>
  <div class="field-group">
    <label class="label">1. 配線方式</label>
    <select v-model="selectedSystem" class="select-input">
      <option v-for="sys in SYSTEM_DEFINITIONS" :key="sys.id" :value="sys.id">
        {{ sys.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { SYSTEM_DEFINITIONS } from '@/types/appDefinitions';

const selectedSystem = defineModel<string>({ required: true });
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

.select-input {
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
  color-scheme: dark; /* 白浮き崩れ防止のためのネイティブダーク設定 */
  transition: border-color 0.2s, background-color 0.2s;
}

.select-input:focus {
  border-color: #38bdf8;
}

option {
  background-color: #1e293b; /* 白枠崩れ修正 */
  color: #f8fafc;
  padding: 8px;
}

/* PC向けレスポンシブ拡張 */
@media (min-width: 768px) {
  .label {
    font-size: 15px;
    margin-bottom: 10px;
  }
  .select-input {
    min-height: 52px;
    font-size: 16px;
    padding: 12px;
  }
}
</style>