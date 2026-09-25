<!-- src/components/Motor/BreakerSelect.vue -->
<template>
  <div class="input-group">
    <label class="sub-label">保護遮断器 種別選択</label>
    <div class="preset-chips">
      <!-- 自動判定ボタン -->
      <button
        type="button"
        :class="['chip-btn', modelValue === 'auto' ? 'active' : '']"
        :disabled="driveMode === 'inverter'"
        @click="updateMode('auto')"
      >
        自動判定 (15kW基準)
      </button>

      <!-- モーターブレーカーボタン (単体・15kW以下・他負荷なしのみ) -->
      <button
        type="button"
        :class="['chip-btn', modelValue === 'motor_breaker' ? 'active' : '']"
        :disabled="isMotorBreakerDisabled"
        @click="updateMode('motor_breaker')"
      >
        モーターブレーカー
      </button>

      <!-- 配線用遮断器 (MCCB) ボタン (複数台・他負荷時も選択可能) -->
      <button
        type="button"
        :class="['chip-btn', modelValue === 'mccb' ? 'active' : '']"
        @click="updateMode('mccb')"
      >
        配線用遮断器 (MCCB)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MotorBreakerType } from '@/types/appDefinitions';

interface Props {
  modelValue: MotorBreakerType;
  driveMode: 'direct' | 'inverter';
  isOver15kW: boolean;
  motorCount: number;
  otherLoadAmp: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'auto',
  driveMode: 'direct',
  isOver15kW: false,
  motorCount: 1,
  otherLoadAmp: 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: MotorBreakerType): void;
}>();

// 単体モーター専用保護（MB）のみ、複数台や他負荷時にボタンを非活性化
const isMotorBreakerDisabled = computed(() => {
  return (
    props.isOver15kW ||
    props.driveMode === 'inverter' ||
    props.otherLoadAmp > 0
  );
});

const updateMode = (mode: MotorBreakerType) => {
  emit('update:modelValue', mode);
};
</script>

<style scoped>
.sub-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-btn {
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s ease;
}

.chip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chip-btn.active,
.chip-btn:active:not(:disabled) {
  background-color: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
}

/* PC向けレスポンシブ拡張 */
@media (min-width: 768px) {
  .preset-chips {
    flex-wrap: nowrap;
  }
  .chip-btn {
    flex: 1;
    text-align: center;
  }
  .chip-btn:hover:not(:disabled):not(.active) {
    background-color: #0ea5e9;
    color: #ffffff;
  }
}
</style>