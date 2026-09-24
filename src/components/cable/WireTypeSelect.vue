<!-- src/components/cable/WireTypeSelect.vue -->
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

    <!-- 機器専用・屋内固定配線不可の警告バナー表示 -->
    <div v-if="selectedCable?.isIndoorWiringForbidden" class="warning-banner">
      <div class="warning-header">
        <span class="warning-icon">⚠️</span>
        <span class="warning-title">屋内固定配線 使用不可</span>
      </div>
      <p class="warning-text">
        {{ selectedCable.warningMessage || 'この電線・コードは機器への電源供給および延長用です。壁内や天井裏などの屋内固定配線には使用できません（電気設備技術基準・内線規程）。' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  CableTypeCode,
  CABLE_TYPES,
  CABLE_TEMP_GROUPS,
} from '@/types/appDefinitions';

interface Props {
  modelValue: CableTypeCode;
}

interface Emits {
  (e: 'update:modelValue', value: CableTypeCode): void;
  (e: 'change', value: CableTypeCode): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedCable = computed(() => {
  return CABLE_TYPES.find((c) => c.id === props.modelValue);
});

const getCablesByGroup = (items: string[]) => {
  return CABLE_TYPES.filter((cable) => items.includes(cable.id));
};

const onChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const val = target.value as CableTypeCode;
  emit('update:modelValue', val);
  emit('change', val);
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
  color-scheme: dark; /* 白浮き崩れ防止のためのネイティブダーク設定 */
  transition: border-color 0.2s, background-color 0.2s;
}

.select-input:focus {
  border-color: #38bdf8;
}

optgroup {
  background-color: #1e293b;
  color: #38bdf8;
  font-weight: bold;
}

option {
  background-color: #1e293b; /* ドロップダウンメニュー白崩れ修正 */
  color: #f8fafc;
  padding: 8px;
}

/* 屋内配線不可の警告用スタイリング */
.warning-banner {
  margin-top: 10px;
  padding: 10px 14px;
  background-color: #451a03;
  border: 1px solid #f59e0b;
  border-radius: 10px;
  box-sizing: border-box;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.warning-icon {
  font-size: 14px;
}

.warning-title {
  font-size: 13px;
  font-weight: bold;
  color: #fbbf24;
}

.warning-text {
  margin: 4px 0 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #fde68a;
}

/* PC向けレスポンシブ拡張 */
@media (min-width: 768px) {
  .label {
    font-size: 14px;
  }
  .select-input {
    min-height: 52px;
    font-size: 15px;
    padding: 12px;
  }
  .warning-banner {
    padding: 14px 18px;
    margin-top: 14px;
  }
  .warning-title {
    font-size: 14px;
  }
  .warning-text {
    font-size: 13px;
  }
}
</style>