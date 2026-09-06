import { ref } from 'vue';
import { SYSTEM_DEFINITIONS, SystemType } from '@/types/appDefinitions';

export const SYSTEM_TYPES: SystemType[] = SYSTEM_DEFINITIONS;

export function useCabling() {
  const selectedSystemId = ref<string>('1P2W');
  return {
    selectedSystemId,
    SYSTEM_TYPES,
  };
}