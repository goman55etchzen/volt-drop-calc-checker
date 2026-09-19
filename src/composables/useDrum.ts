// src/composables/useDrum.ts
import { ref } from 'vue';

export function useDrum<T>(options: T[], initialValue: T) {
  const selectedValue = ref<T>(initialValue);

  const selectValue = (val: T) => {
    selectedValue.value = val;
  };

  // 次へ進む（端に達したら最初に戻る無限ループ）
  const next = () => {
    const idx = options.indexOf(selectedValue.value);
    const nextIdx = (idx + 1) % options.length;
    selectedValue.value = options[nextIdx];
  };

  // 前へ戻る（端に達したら最後尾に戻る無限ループ）
  const prev = () => {
    const idx = options.indexOf(selectedValue.value);
    const prevIdx = (idx - 1 + options.length) % options.length;
    selectedValue.value = options[prevIdx];
  };

  return {
    selectedValue,
    selectValue,
    next,
    prev,
  };
}