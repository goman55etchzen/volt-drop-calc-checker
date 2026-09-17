import { ref } from 'vue';
import { CABLE_TYPES, CableTypeCode } from '@/types/appDefinitions';

export function useWire() {
  const selectedCableId = ref<CableTypeCode>('iv');
  return { selectedCableId, CABLE_TYPES };
}