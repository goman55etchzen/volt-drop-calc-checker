<template>
  <div class="field-group">
    <label class="label">電線・ケーブル種別</label>
    <select
      :value="modelValue"
      class="select-input"
      @change="onChange"
    >
      <optgroup
        v-for="group in CABLE_TEMP_GROUPS"
        :key="group.label"
        :label="group.label"
      >
        <option
          v-for="cable in getCablesByGroup(group.items)"
          :key="cable.id"
          :value="cable.id"
        >
          {{ cable.name }} - {{ cable.desc }}
        </option>
      </optgroup>
    </select>
  </div>
</template>

<script setup lang="ts">
import {
  CABLE_TYPES,
  CABLE_TEMP_GROUPS,
  WireTypeSelectProps,
  WireTypeSelectEmits
} from '@/types/appDefinitions';

defineProps<WireTypeSelectProps>();
const emit = defineEmits<WireTypeSelectEmits>();

const getCablesByGroup = (items: string[]) => {
  return CABLE_TYPES.filter((cable) => items.includes(cable.id));
};

const onChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
  emit('change');
};
</script>

<style scoped>
.field-group {
  margin-top: 12px;
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}

.select-input {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #475569;
  font-size: 14px;
  background-color: #334155;
  color: #f8fafc;
  outline: none;
  box-sizing: border-box;
}

optgroup {
  background-color: #1e293b;
  color: #38bdf8;
  font-weight: bold;
}

option {
  background-color: #334155;
  color: #f8fafc;
}
</style>