// src/composables/selected1.ts
import { ref } from 'vue';
import type { EnvironmentType, PowerFrequency } from '@/types/appDefinitions';

export function useSelected1() {
  const voltage = ref<number>(200);
  const frequency = ref<PowerFrequency>(50);
  const environment = ref<EnvironmentType>('normal');

  return {
    voltage,
    frequency,
    environment,
  };
}