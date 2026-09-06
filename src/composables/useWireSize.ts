import { ref } from 'vue';
import { WIRE_SIZES } from '@/types/appDefinitions';

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