import { ref, computed, Ref } from 'vue';
import {
  SYSTEM_DEFINITIONS,
  SystemType,
  CABLE_TYPES,
  WIRE_SIZES
} from '@/types/appDefinitions';

export const SYSTEM_TYPES: SystemType[] = SYSTEM_DEFINITIONS;

export function useCabling(
  voltage: Ref<number>,
  totalI: Ref<number>,
  selectedWireName: Ref<string>,
  selectedCableId: Ref<string>,
  targetPercent: Ref<number>
) {
  const selectedSystemId = ref<string>('1P2W');

  const currentSystem = computed(
    () =>
      SYSTEM_DEFINITIONS.find((s) => s.id === selectedSystemId.value) || SYSTEM_DEFINITIONS[0]
  );

  const currentCable = computed(
    () =>
      CABLE_TYPES.find((c) => c.id === selectedCableId.value) || CABLE_TYPES[0]
  );

  const currentWire = computed(
    () =>
      WIRE_SIZES.find((w) => w.name === selectedWireName.value) || WIRE_SIZES[0]
  );

  // 許容電圧降下 (V)
  const allowDropV = computed(() => voltage.value * (targetPercent.value / 100));

  // 許容配線長 (m) 算出
  const maxLen = computed(() => {
    const k = currentSystem.value.k;
    const area = currentWire.value.area;
    const i = totalI.value;
    return k > 0 && i > 0 ? (allowDropV.value * 1000 * area) / (k * i) : 0;
  });

  // 許容電流値 (キーが存在しない場合は安全側として 0A 扱い)
  const maxLimit = computed(
    () => currentCable.value.limits[currentWire.value.name] ?? 0
  );

  // 過電流判定
  const isOverCurrent = computed(() => totalI.value > maxLimit.value);

  return {
    selectedSystemId,
    SYSTEM_TYPES,
    currentSystem,
    currentCable,
    currentWire,
    maxLen,
    isOverCurrent,
  };
}