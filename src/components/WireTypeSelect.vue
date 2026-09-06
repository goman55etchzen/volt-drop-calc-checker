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
import { CABLE_TYPES, WireTypeSelectProps, WireTypeSelectEmits } from '@/types/appDefinitions';

defineProps<WireTypeSelectProps>();
const emit = defineEmits<WireTypeSelectEmits>();

const selectCable = (id: string) => {
  emit('update:modelValue', id);
  emit('change');
};
</script>

<style scoped>
.field-group {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #f8fafc;
}

.cable-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cable-card {
  padding: 12px 10px;
  border: 1px solid #475569;
  border-radius: 10px;
  background: #334155;
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 72px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.cable-card.active {
  border-color: #38bdf8;
  background: #0284c7;
  box-shadow: 0 0 0 1px #38bdf8;
}

.cable-title {
  font-size: 13px;
  font-weight: bold;
  color: #f8fafc;
  line-height: 1.3;
  margin-bottom: 4px;
}

.cable-card.active .cable-title {
  color: #ffffff;
}

.cable-desc {
  font-size: 11px;
  color: #cbd5e1;
  line-height: 1.4;
}

.cable-card.active .cable-desc {
  color: #e0f2fe;
}
</style>