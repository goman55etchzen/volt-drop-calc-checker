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
import { SYSTEM_DEFINITIONS } from '../types/appDefinitions';

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
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  font-size: 15px;
  background-color: #334155;
  color: #f8fafc;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.select-input:focus {
  border-color: #38bdf8;
}
</style>