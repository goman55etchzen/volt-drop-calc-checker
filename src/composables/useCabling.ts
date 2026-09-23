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

  // 選択された電線サイズが該当ケーブルの limits 定義に存在するか確認
  const isWireSizeValidForCable = computed(() => {
    return currentWire.value.name in currentCable.value.limits;
  });

  // 許容電流値 (キーが存在しない場合は過電流判定を行わないよう Infinity と設定)
  const maxLimit = computed(() => {
    const limit = currentCable.value.limits[currentWire.value.name];
    return limit !== undefined ? limit : Infinity;
  });

  // 過電流判定（電線サイズが適合し、かつ負荷電流が許容電流を超える場合のみ true）
  const isOverCurrent = computed(() => {
    if (!isWireSizeValidForCable.value) return false;
    return totalI.value > maxLimit.value;
  });

  // 屋内固定配線不可判定および警告テキスト
  const isIndoorWiringForbidden = computed(
    () => !!currentCable.value.isIndoorWiringForbidden
  );

  const indoorWiringWarning = computed(() =>
    isIndoorWiringForbidden.value ? currentCable.value.warningMessage || '' : ''
  );

  return {
    selectedSystemId,
    SYSTEM_TYPES,
    currentSystem,
    currentCable,
    currentWire,
    maxLen,
    isOverCurrent,
    isWireSizeValidForCable,
    isIndoorWiringForbidden,
    indoorWiringWarning,
  };
}