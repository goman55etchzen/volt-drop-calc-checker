<!-- src/components/common/Notice.vue -->
<template>
  <div class="notice-cards-wrapper">
    <!-- 合算定格電流スライドインカード（独立コンポーネント） -->
    <IrSectionCard
      v-model:isOpen="isTotalAmpOpenProxy"
      :display-total-load-amp="displayTotalLoadAmp"
      :calculated-amp="calculatedAmp"
      :motor-count="motorCount"
      :other-load-amp="otherLoadAmp"
    />

    <!-- 力率・効率 詳細設定スライドインカード（独立コンポーネント） -->
    <CapacitorSectionCard
      v-model:isOpen="isPowerFactorOpenProxy"
      v-model:powerFactor="powerFactorProxy"
      v-model:targetPowerFactor="targetPowerFactorProxy"
      v-model:efficiency="efficiencyProxy"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IrSectionCard from '@/components/Motor/IrSectionCard.vue';
import CapacitorSectionCard from '@/components/Motor/CapacitorSectionCard.vue';

const props = defineProps<{
  isTotalAmpOpen: boolean;
  displayTotalLoadAmp: number;
  calculatedAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  isPowerFactorOpen: boolean;
  powerFactor: number;
  targetPowerFactor: number;
  efficiency: number;
}>();

const emit = defineEmits<{
  (e: 'update:isTotalAmpOpen', value: boolean): void;
  (e: 'update:isPowerFactorOpen', value: boolean): void;
  (e: 'update:powerFactor', value: number): void;
  (e: 'update:targetPowerFactor', value: number): void;
  (e: 'update:efficiency', value: number): void;
}>();

const isTotalAmpOpenProxy = computed({
  get: () => props.isTotalAmpOpen,
  set: (val) => emit('update:isTotalAmpOpen', val),
});

const isPowerFactorOpenProxy = computed({
  get: () => props.isPowerFactorOpen,
  set: (val) => emit('update:isPowerFactorOpen', val),
});

const powerFactorProxy = computed({
  get: () => props.powerFactor,
  set: (val) => emit('update:powerFactor', val),
});

const targetPowerFactorProxy = computed({
  get: () => props.targetPowerFactor,
  set: (val) => emit('update:targetPowerFactor', val),
});

const efficiencyProxy = computed({
  get: () => props.efficiency,
  set: (val) => emit('update:efficiency', val),
});
</script>

<style scoped>
.notice-cards-wrapper {
  display: contents;
}
</style>