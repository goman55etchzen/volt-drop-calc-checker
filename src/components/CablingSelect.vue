<template>
  <div class="field-group">
    <label class="label">1. 配線方式</label>
    <select v-model="selectedSystem" class="select-input">
      <option v-for="sys in SYSTEM_TYPES" :key="sys.id" :value="sys.id">
        {{ sys.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { SYSTEM_TYPES } from '../composables/useCabling';

const selectedSystem = defineModel<string>({ required: true });
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
.select-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  background-color: #ffffff;
  color: #0f172a; /* ← これを追加して文字色を強制指定 */
}
</style>