<template>
  <div class="field-group">
    <label class="label">3. ケーブル・電線種別</label>
    <div class="cable-grid">
      <div
        v-for="c in CABLE_TYPES"
        :key="c.id"
        class="cable-card"
        :class="{ active: modelValue === c.id }"
        @click="selectCable(c.id)"
      >
        <div class="cable-title">{{ c.name }}</div>
        <div class="cable-desc">{{ c.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CABLE_TYPES } from '../composables/useWire';

defineProps<{ modelValue: string }>();
const emit = defineEmits(['update:modelValue', 'change']);

const selectCable = (id: string) => {
  emit('update:modelValue', id);
  emit('change');
};
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
/* 2列グリッド構成 */
.cable-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.cable-card {
  padding: 10px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 54px;
}
.cable-card.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}
.cable-title {
  font-size: 13px;
  font-weight: bold;
  color: #0f172a;
}
.cable-card.active .cable-title {
  color: #2563eb;
}
.cable-desc {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.2;
}
</style>
