import { ref } from 'vue';

export interface SystemType {
  id: string;
  label: string;
  k: number;
  defaultVoltage: number;
}

export const SYSTEM_TYPES: SystemType[] = [
  { id: '1p2w', label: '単相2線式 / 直流2線', k: 35.6, defaultVoltage: 100 },
  { id: '3p3w', label: '三相3線式 (線間)', k: 30.8, defaultVoltage: 200 },
  { id: '1p3w', label: '単相3線式 / 三相4線式', k: 17.8, defaultVoltage: 100 },
];

export function useCabling() {
  const selectedSystemId = ref<string>('1p2w');
  return {
    selectedSystemId,
    SYSTEM_TYPES,
  };
}
