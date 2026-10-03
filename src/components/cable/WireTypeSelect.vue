<!-- src/components/cable/WireTypeSelect.vue -->
<template>
  <div class="field-group">
    <label class="label">3. 電線・ケーブル種別</label>
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
  CABLE_TEMP_GROUPS
} from '@/types/appDefinitions';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

// グループに属するケーブルIDの配列から、ケーブルの詳細情報オブジェクトの配列を取得
const getCablesByGroup = (items: string[]) => {
  return CABLE_TYPES.filter(cable => items.includes(cable.id));
};

// セレクトボックス変更時のハンドラ
const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  // v-model用の更新イベント
  emit('update:modelValue', value);
  // Home.vue等でフックしている@changeイベント（openSizePicker等の呼び出し用）
  emit('change', value);
};
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
  background-color: #1e293b;
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