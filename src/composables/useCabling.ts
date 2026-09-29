// src/composables/useCabling.ts
import { ref, computed, type Ref } from "vue";
import CableBase, {
  SYSTEM_DEFINITIONS,
  CABLE_TYPES,
  type VoltageDropParams,
  type WireSelectionParams,
  type SystemType,
  type CableTypeCode,
  type AvailableWireResult,
  type CableType,
} from "@/base/cableBase";

export const SYSTEM_TYPES: SystemType[] = SYSTEM_DEFINITIONS;

export interface UseCablingOptions {
  /** 周囲温度 (℃) デフォルト: 30 */
  ambientTemp?: Ref<number>;
  /** 同一管内電線数 デフォルト: 1 */
  wireCount?: Ref<number>;
  /** 電線並列数 デフォルト: 1 */
  parallelCount?: Ref<number>;
  /** 力率 cosθ (0.0〜1.0) デフォルト: 1.0 */
  powerFactor?: Ref<number>;
  /** インピーダンス(R, X)を用いた精密計算フラグ デフォルト: false */
  useImpedance?: Ref<boolean>;
  /** 配線長 L (m) 電圧降下 e (V) を計算する場合に指定 */
  distance?: Ref<number>;
}

export function useCabling(
  voltage: Ref<number>,
  totalI: Ref<number>,
  selectedWireName: Ref<string>,
  selectedCableId: Ref<string | CableTypeCode>,
  targetPercent: Ref<number>,
  options: UseCablingOptions = {},
) {
  // 選択中の配線方式ID
  const selectedSystemId = ref<string>("1P2W");

  // オプショナルパラメータの参照（未指定時はデフォルト値）
  const ambientTemp = options.ambientTemp ?? ref(30);
  const wireCount = options.wireCount ?? ref(1);
  const parallelCount = options.parallelCount ?? ref(1);
  const powerFactor = options.powerFactor ?? ref(1.0);
  const useImpedance = options.useImpedance ?? ref(false);
  const distance = options.distance ?? ref(0);

  // ----------------------------------------------------------------
  // 1. CableBase マスタ参照のリアクティブ化
  // ----------------------------------------------------------------
  const currentSystem = computed(() =>
    CableBase.getSystem(selectedSystemId.value),
  );

  const currentCable = computed<CableType | undefined>(() => {
    const cableId = selectedCableId.value as CableTypeCode;
    return CABLE_TYPES.find((c) => c.id === cableId);
  });

  const cableTypeDefinition = computed<CableType | undefined>(() => {
    return currentCable.value;
  });

  const currentWire = computed(() => {
    return (
      CableBase.getWireSize(selectedWireName.value) || {
        name: selectedWireName.value,
        area: CableBase.getCableSpec(selectedWireName.value)?.area ?? 0,
        amp: 0,
      }
    );
  });

  // ----------------------------------------------------------------
  // 2. 電圧降下・配線長計算 (CableBase 連携)
  // ----------------------------------------------------------------
  /** 許容電圧降下 (V) */
  const allowDropV = computed(
    () => voltage.value * (targetPercent.value / 100),
  );

  /** 最大許容配線長 L (m) */
  const maxLen = computed(() => {
    return CableBase.calculateMaxDistance(
      voltage.value,
      targetPercent.value,
      totalI.value,
      selectedWireName.value,
      selectedSystemId.value,
    );
  });

  /** 実配線長に基づく電圧降下値 e (V) (distance > 0 の場合) */
  const voltageDrop = computed(() => {
    if (distance.value <= 0) return 0;
    const params: VoltageDropParams = {
      systemId: selectedSystemId.value,
      current: totalI.value,
      distance: distance.value,
      wireSizeName: selectedWireName.value,
      powerFactor: powerFactor.value,
      useImpedance: useImpedance.value,
    };
    return CableBase.calculateVoltageDrop(params);
  });

  /** 電圧降下率 (%) */
  const voltageDropPercent = computed(() => {
    if (voltage.value <= 0) return 0;
    return (voltageDrop.value / voltage.value) * 100;
  });

  // ----------------------------------------------------------------
  // 3. 許容電流・過電流判定 (CableBase 連携)
  // ----------------------------------------------------------------
  /** 選択された電線サイズが有効か */
  const isWireSizeValidForCable = computed(() => {
    return CableBase.isValidWireSize(selectedWireName.value);
  });

  /** CableBase による動的許容電流計算結果 (周囲温度・管内本数・並列数補正適用) */
  const allowableCurrentInfo = computed(() => {
    const cableType = selectedCableId.value as CableTypeCode;
    return CableBase.getAllowableCurrent(
      cableType,
      selectedWireName.value,
      ambientTemp.value,
      wireCount.value,
      parallelCount.value,
    );
  });

  /** 許容電流値 (A) */
  const maxLimit = computed(() => {
    const calculated = allowableCurrentInfo.value.totalAllowAmp;
    if (calculated > 0) return calculated;
    return Infinity;
  });

  /** 過電流判定 (負荷電流 > 許容電流) */
  const isOverCurrent = computed(() => {
    if (!isWireSizeValidForCable.value) return false;
    return totalI.value > maxLimit.value;
  });

  // ----------------------------------------------------------------
  // 4. 全電線サイズの評価・最適サイズ選定 (CableBase 連携)
  // ----------------------------------------------------------------
  const selectionParams = computed<WireSelectionParams>(() => ({
    systemId: selectedSystemId.value,
    voltage: voltage.value,
    targetDropPercent: targetPercent.value,
    current: totalI.value,
    distance: distance.value,
    cableType: selectedCableId.value as CableTypeCode,
    ambientTemp: ambientTemp.value,
    wireCount: wireCount.value,
    parallelCount: parallelCount.value,
    powerFactor: powerFactor.value,
  }));

  /** 全サイズの一覧評価 */
  const allWireEvaluations = computed<AvailableWireResult[]>(() => {
    return CableBase.evaluateAllWireSizes(selectionParams.value);
  });

  /** 条件を満たす最小（最適）の電線サイズ */
  const suitableWire = computed<AvailableWireResult | null>(() => {
    return CableBase.selectSuitableWireSize(selectionParams.value);
  });

  // ----------------------------------------------------------------
  // 5. 屋内固定配線不可判定および警告
  // ----------------------------------------------------------------
  const isIndoorWiringForbidden = computed(() => {
    const cable = currentCable.value;
    if (cable && cable.isIndoorWiringForbidden !== undefined) {
      return cable.isIndoorWiringForbidden;
    }
    const forbiddenCables: CableTypeCode[] = ["vct", "vctf", "vff"];
    return forbiddenCables.includes(selectedCableId.value as CableTypeCode);
  });

  const indoorWiringWarning = computed(() => {
    if (!isIndoorWiringForbidden.value) return "";
    const cable = currentCable.value;
    if (cable?.warningMessage) {
      return cable.warningMessage;
    }
    return "屋内固定配線には使用できません。";
  });

  // ----------------------------------------------------------------
  // 6. 電線サイズステップ変更ヘルパー
  // ----------------------------------------------------------------
  const stepWireSize = (step: "next" | "prev") => {
    const nextName = CableBase.getAdjacentWireSize(
      selectedWireName.value,
      step,
    );
    selectedWireName.value = nextName;
  };

  return {
    // 既存互換プロパティ
    selectedSystemId,
    SYSTEM_TYPES,
    currentSystem,
    currentCable,
    cableTypeDefinition,
    currentWire,
    maxLen,
    isOverCurrent,
    isWireSizeValidForCable,
    isIndoorWiringForbidden,
    indoorWiringWarning,

    // CableBase 連携拡張プロパティ
    allowDropV,
    voltageDrop,
    voltageDropPercent,
    maxLimit,
    allowableCurrentInfo,
    allWireEvaluations,
    suitableWire,
    stepWireSize,
  };
}