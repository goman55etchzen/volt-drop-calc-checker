import { ref } from 'vue';
import { CABLE_TYPES } from '../types/appDefinitions';

export function useWire() {
  const selectedCableId = ref<string>('iv');
  return { selectedCableId, CABLE_TYPES };
}