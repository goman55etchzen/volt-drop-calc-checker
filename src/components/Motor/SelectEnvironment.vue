<!-- src/components/Motor/SelectEnvironment.vue -->
<template>
  <div class="input-group">
    <label class="input-label">6. 接地環境条件</label>
    <select 
      class="base-select"
      :value="modelValue || ''" 
      @change="handleChange"
    >
      <option value="" disabled>選択してください</option>
      <option value="normal">乾燥した場所 (通常)</option>
      <option value="enclosure">金属管・盤内容器 (接触リスク有)</option>
      <option value="wet">水気のある場所 (湿潤・漏電リスク高)</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { EnvironmentType } from '@/appDefinitions'; // パスは適宜調整してください

defineProps<{
  modelValue: EnvironmentType | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: EnvironmentType): void;
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value as EnvironmentType);
};
</script>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.input-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}
.base-select {
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
}
</style>