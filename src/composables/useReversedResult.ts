// src/composables/useReversedResult.ts
import { computed, type Ref } from 'vue'
import { useReversedCallc } from '@/composables/useReversedCallc'
import type {
  CalculationInputMode,
  CableTypeCode,
  LoadType,
  InstallationType
} from '@/types/appDefinitions'

export interface UseReversedResultParams {
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

export function useReversedResult(params: UseReversedResultParams) {
  // 1. 逆算計算Composableの呼び出し
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

  // 2. 表示用データのフィルタリング（細線と標準線の分離）
  const isSmallWire = (area: number): boolean => area <= 1.25

  const mainAvailableWires = computed(() => {
    return availableWires.value.filter((w) => !isSmallWire(w.area))
  })

  const smallAvailableWires = computed(() => {
    return availableWires.value.filter((w) => isSmallWire(w.area))
  })

  // 3. ResultCard 向け統合プロパティの集約
  /** 最大許容配線長 (m) */
  const maxLen = computed<number>(() => {
    if (recommendedWire.value && 'maxDistance' in recommendedWire.value) {
      return (recommendedWire.value as { maxDistance?: number }).maxDistance ?? params.oneWayDistance.value
    }
    return params.oneWayDistance.value
  })

  /** 過電流・エラー判定フラグ */
  const isOverCurrent = computed<boolean>(() => {
    if (hasError.value) return true
    if (calculationIssues.value.some((issue) => issue.level === 'error')) return true
    
    // 推奨電線の有無ではなく、「適合可能な電線が１つでもあるか」で判定する
    const hasOkWire = availableWires.value.some(w => w.isOkForLoad)
    return !hasOkWire
  }) // ← ★ ここが欠落していました

  // 4. コンポーネントへ返すデータオブジェクト
  return {
    maxLen,
    isOverCurrent,
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

export type UseReversedResultReturn = ReturnType<typeof useReversedResult>