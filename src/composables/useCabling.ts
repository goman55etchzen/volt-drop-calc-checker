import { ref, computed, type Ref } from 'vue';
import { CableBase, type VoltageDropParams, type WireSelectionParams } from '@/base/cableBase';
import {
  SYSTEM_DEFINITIONS,
  type SystemType,
  type CableTypeCode,
  type AvailableWireResult
} from '@/types/appDefinitions';

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
  options: UseCablingOptions = {}
) {
  // 選択中の配線方式ID
  const selectedSystemId = ref<string>('1P2W');

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
  const currentSystem = computed(() => CableBase.getSystem(selectedSystemId.value));

  const currentCable = computed(() => {
    const cableId = selectedCableId.value as CableTypeCode;
    return (
      CableBase.getCableSpec(selectedWireName.value)
        ? (SYSTEM_DEFINITIONS as any) // 安全なフォールバック
        : null
    ) ?? undefined;
  });

  // CableType定義の直接取得
  const cableTypeDefinition = computed(() => {
    const cableId = selectedCableId.value as CableTypeCode;
    return (
      import('@/types/appDefinitions').then ? 
      null : null
    );
  });

  const currentWire = computed(() => {
    return CableBase.getWireSize(selectedWireName.value) || {
      name: selectedWireName.value,
      area: CableBase.getCableSpec(selectedWireName.value)?.area ?? 0,
      amp: 0
    };
  });

  // ----------------------------------------------------------------
  // 2. 電圧降下・配線長計算 (CableBase 連携)
  // ----------------------------------------------------------------
  /** 許容電圧降下 (V) */
  const allowDropV = computed(() => voltage.value * (targetPercent.value / 100));

  /** 最大許容配線長 L (m) */
  const maxLen = computed(() => {
    return CableBase.calculateMaxDistance(
      voltage.value,
      targetPercent.value,
      totalI.value,
      selectedWireName.value,
      selectedSystemId.value
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
      useImpedance: useImpedance.value
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
  /** 選択された電線サイズが対象ケーブルの limits またはスペックに存在するか */
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
      parallelCount.value
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
    powerFactor: powerFactor.value
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
    const forbiddenCables: CableTypeCode[] = ['vct', 'vctf', 'vff'];
    return forbiddenCables.includes(selectedCableId.value as CableTypeCode);
  });

  const indoorWiringWarning = computed(() => {
    if (!isIndoorWiringForbidden.value) return '';
    if (selectedCableId.value === 'vct') {
      return 'VCTは機器への電源供給・延長用です。壁内や天井などの屋内固定配線には使用できません（電気設備技術基準）。';
    }
    if (selectedCableId.value === 'vctf') {
      return 'VCTFは小型機器電源供給・延長コード専用です。壁内等の固定配線には使用できません（内線規程）。';
    }
    if (selectedCableId.value === 'vff') {
      return '小判コード(VFF)は器具電源・延長用です。壁内や造営物への固定配線には使用できません。';
    }
    return '屋内固定配線には使用できません。';
  });

  // ----------------------------------------------------------------
  // 6. 電線サイズステップ変更ヘルパー
  // ----------------------------------------------------------------
  const stepWireSize = (step: 'next' | 'prev') => {
    const nextName = CableBase.getAdjacentWireSize(selectedWireName.value, step);
    selectedWireName.value = nextName;
  };

  return {
    // 既存互換プロパティ
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

    // CableBase 連携による拡張プロパティ
    allowDropV,
    voltageDrop,
    voltageDropPercent,
    maxLimit,
    allowableCurrentInfo,
    allWireEvaluations,
    suitableWire,
    stepWireSize
  };
}