// src/composables/useResult.ts
import { computed, type Ref } from 'vue'
import { useReversedCallc } from '@/composables/useReversedCallc'
import type {
  CalculationInputMode,
  CableTypeCode,
  LoadType,
  InstallationType
} from '@/types/appDefinitions'

export interface UseResultParams {
  voltage: Ref<number>
  targetPercent: Ref<number>
  inputMode: Ref<CalculationInputMode>
  loadWatt: Ref<number>
  loadCurrent: Ref<number>
  oneWayDistance: Ref<number>
  selectedSystemId: Ref<string>
  selectedCableType: Ref<CableTypeCode>
  powerFactor: Ref<number>
  ignorePowerFactor: Ref<boolean>
  loadType: Ref<LoadType>
  motorKw: Ref<number>
  installationType: Ref<InstallationType>
  isContinuous: Ref<boolean>
  ambientTemp: Ref<number>
  wireCount: Ref<number>
}

export function useResult(params: UseResultParams) {
  // 1. 計算処理の実行
  const {
    calculatedLoadCurrent,
    currentCableType,
    calculationIssues,
    hasError,
    availableWires,
    recommendedWire,
    breakerStatus
  } = useReversedCallc(
    params.voltage,
    params.targetPercent,
    params.inputMode,
    params.loadWatt,
    params.loadCurrent,
    params.oneWayDistance,
    params.selectedSystemId,
    params.selectedCableType,
    params.powerFactor,
    params.ignorePowerFactor,
    params.loadType,
    params.motorKw,
    params.installationType,
    params.isContinuous,
    params.ambientTemp,
    params.wireCount
  )

  // 2. 電線サイズによる分類（標準線 / 細線）
  const isSmallWire = (area: number): boolean => area <= 1.25

  const mainAvailableWires = computed(() => {
    return availableWires.value.filter((w) => !isSmallWire(w.area))
  })

  const smallAvailableWires = computed(() => {
    return availableWires.value.filter((w) => isSmallWire(w.area))
  })

  // 3. ResultCard.vue 等の共通カードコンポーネント向けインターフェース抽出
  /** 最大許容配線長 (m) */
  const maxLen = computed<number>(() => {
    if (!recommendedWire.value) return 0
    // CableBase が算出した、推奨電線での電圧降下上の最大こう長 [m]
    return recommendedWire.value.maxDistanceMeters
  })

  /** 電流オーバー・適合不能判定 */
  const isOverCurrent = computed<boolean>(() => {
    if (hasError.value) return true
    if (calculationIssues.value.some((issue) => issue.level === 'error')) return true
    
    // 適合可能な電線が１つも存在しない場合のみ true（電流オーバー・適合不能）とする
    const hasOkWire = availableWires.value.some(w => w.isOkForLoad)
    return !hasOkWire
  })
  // 4. 表示用データおよび共通カード用インターフェースを集約して返す
  return {
    // 共通カード用表示データ
    maxLen,
    isOverCurrent,

    // 詳細計算データ
    calculatedLoadCurrent,
    currentCableType,
    calculationIssues,
    hasError,
    recommendedWire,
    breakerStatus,
    mainAvailableWires,
    smallAvailableWires
  }
}

export type UseResultReturn = ReturnType<typeof useResult>