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
import { CABLE_TYPES } from '../composables/useWire'

defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue', 'change'])

const selectCable = (id: string) => {
  emit('update:modelValue', id)
  emit('change')
}
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
  color: #f8fafc; /* くっきり見える明るい白 */
}

.cable-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cable-card {
  padding: 12px 10px; /* 余白を広げて重なりを防止 */
  border: 1px solid #475569;
  border-radius: 10px;
  background: #334155; /* ダーク背景に合わせた落ち着いたカード色 */
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 72px; /* 高さを確保 */
  box-sizing: border-box;
  transition: all 0.2s ease;
}

/* 選択時のスタイリング */
.cable-card.active {
  border-color: #38bdf8;
  background: #0284c7;
  box-shadow: 0 0 0 1px #38bdf8;
}

.cable-title {
  font-size: 13px;
  font-weight: bold;
  color: #f8fafc;
  line-height: 1.3; /* 行間を確保 */
  margin-bottom: 4px;
}

.cable-card.active .cable-title {
  color: #ffffff;
}

.cable-desc {
  font-size: 11px;
  color: #cbd5e1; /* くっきり見える薄グレー */
  line-height: 1.4; /* 折り返し時の文字重なりを完全に防止 */
}

.cable-card.active .cable-desc {
  color: #e0f2fe;
}
</style>