<!-- src/components/common/Notice.vue -->
<template>
  <div class="notice-cards-wrapper">
    <!-- 警告・個別選定の通知カード（右からスライドイン＆常時表示） -->
    <Caution v-if="cautionMessage" :message="cautionMessage" />

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
import Caution from '@/components/Motor/Caution.vue';

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
  cautionMessage?: string; // 追加：警告メッセージ
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
</style>