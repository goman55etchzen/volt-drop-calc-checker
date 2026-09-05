import { ref } from 'vue';

export interface WireSize {
  name: string;
  area: number;
}

export const WIRE_SIZES: WireSize[] = [
  { name: '1.6mm', area: 2.01 },
  { name: '2.0mm', area: 3.14 },
  { name: '2.6mm', area: 5.3 },
  { name: '2.0 sq', area: 2.0 },
  { name: '3.5 sq', area: 3.5 },
  { name: '5.5 sq', area: 5.5 },
  { name: '8.0 sq', area: 8.0 },
  { name: '14.0 sq', area: 14.0 },
];

export function useWireSize() {
  const selectedWireName = ref<string>('2.0mm');
  const isSizePickerOpen = ref<boolean>(false);

  const openSizePicker = () => {
    isSizePickerOpen.value = true;
  };
  const closeSizePicker = () => {
    isSizePickerOpen.value = false;
  };

  return {
    selectedWireName,
    isSizePickerOpen,
    openSizePicker,
    closeSizePicker,
    WIRE_SIZES,
  };
}
