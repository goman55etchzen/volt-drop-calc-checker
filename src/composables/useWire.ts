// src/composables/useWire.ts
import { ref } from 'vue';
import { CABLE_TYPES, CableTypeCode } from '@/base/cableBase';

export function useWire() {
  const selectedCableId = ref<CableTypeCode>('iv');
  return { selectedCableId, CABLE_TYPES };
}