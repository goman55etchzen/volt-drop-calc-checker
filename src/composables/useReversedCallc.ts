// src/composables/useReversedCallc.ts

import { computed, ref, Ref } from 'vue'
import {
  CalculationInputMode, 
  LoadType,
  BreakerStatusResult,
  CalculationIssue,
} from '@/types/appDefinitions'
import {
  InstallationType,
  CableTypeCode,
  SystemType,
  AvailableWireResult,
  SYSTEM_DEFINITIONS,
  CABLE_TYPES,
  CableBase,
  calculateK2
} from '@/base/cableBase'
import { STANDARD_MOTOR_SPECS } from '@/base/motorBase'
import { BREAKER_SIZES, THREE_PHASE_BREAKER_SIZES } from '@/base/breakerBase'

// limiter / isRecommended / maxDistanceMeters は CableBase 側の AvailableWireResult に統合済み
export type ExtendedAvailableWireResult = AvailableWireResult

export function useReversedCallc(
  voltage: Ref<number>,
  targetPercent: Ref<number>,
  inputMode: Ref<CalculationInputMode>,
  loadWatt: Ref<number>,
  rawLoadCurrent: Ref<number>,
  oneWayDistance: Ref<number>,
  selectedSystemId: Ref<string>,
  selectedCableType: Ref<CableTypeCode>,
  powerFactor: Ref<number>,
  ignorePowerFactor: Ref<boolean>,
  loadType: Ref<LoadType>,
  motorKw: Ref<number>,
  installationType: Ref<InstallationType>,
  isContinuous: Ref<boolean>,
  ambientTemp: Ref<number> = ref(30),
  wireCount: Ref<number> = ref(3)
) {
  // 選択中の配線方式を取得
  const currentSystem = computed<SystemType>(() => {
    return (
      SYSTEM_DEFINITIONS.find((s) => s.id === selectedSystemId.value) ||
      SYSTEM_DEFINITIONS[0]
    )
  })

  // 選択中のケーブル定義を取得
  const currentCableType = computed(() => {
    return (
      CABLE_TYPES.find((c) => c.id === selectedCableType.value) ||
      CABLE_TYPES[0]
    )
  })

  // 有効力率 (LED・純抵抗モードオン時は 1.0)
  const effectivePowerFactor = computed(() => {
    return ignorePowerFactor.value ? 1.0 : powerFactor.value
  })

  // モーターのスペックエントリー取得
  const currentMotorSpec = computed(() => {
    return STANDARD_MOTOR_SPECS.find((m) => m.kw === motorKw.value)
  })

  // 負荷電流 (W入力、A直接入力、モーター規約電流を自動分岐算出)
  const calculatedLoadCurrent = computed(() => {
    if (loadType.value === 'motor') {
      const spec = currentMotorSpec.value
      if (!spec) return 4.8
      return voltage.value >= 380 ? spec.amp400V : spec.amp200V
    }

    if (inputMode.value === 'watt') {
      const p = loadWatt.value
      const v = voltage.value || currentSystem.value.defaultVoltage
      const pf = effectivePowerFactor.value
      if (v <= 0 || pf <= 0) return 0

      if (selectedSystemId.value === '3P3W') {
        return Number((p / (Math.sqrt(3) * v * pf)).toFixed(2))
      }
      return Number((p / (v * pf)).toFixed(2))
    }

    return rawLoadCurrent.value
  })

  // 許容電圧降下 (V)
  const allowDropV = computed(() => {
    return voltage.value * (targetPercent.value / 100)
  })

  // 敷設本数に応じた電流減少係数
  const currentReductionFactor = computed(() => {
    return calculateK2(wireCount.value)
  })

  // 警告・情報ログの判定
  const calculationIssues = computed<CalculationIssue[]>(() => {
    const issues: CalculationIssue[] = []
    const L = oneWayDistance.value
    const I = calculatedLoadCurrent.value

    if (!Number.isFinite(L) || L <= 0) {
      issues.push({
        level: 'error',
        code: 'INVALID_DISTANCE',
        title: 'こう長が不正です',
        message: '片道こう長は0より大きい数を入力してください。'
      })
    }

    if (!Number.isFinite(I) || I <= 0) {
      issues.push({
        level: 'error',
        code: 'INVALID_LOAD_CURRENT',
        title: '負荷電流/電力が不正です',
        message: '正しい消費電力(W)または電流値(A)を入力してください。'
      })
    }

    if (ambientTemp.value > 30) {
      issues.push({
        level: 'info',
        code: 'TEMP_CORRECTION_APPLIED',
        title: '周囲温度補正を適用中',
        message: `周囲温度 ${ambientTemp.value}℃ (絶縁体上限 ${currentCableType.value.maxTemp}℃) による温度補正を適用しています。`
      })
    }

    if (wireCount.value > 1) {
      const label = installationType.value.startsWith('conduit') ? '管内収容' : '束ね・露出'
      issues.push({
        level: 'info',
        code: 'WIRE_COUNT_REDUCTION_APPLIED',
        title: `${label}本数補正を適用中`,
        message: `${label}本数 ${wireCount.value}本 による電流減少係数 (K2=${currentReductionFactor.value}) を適用しています。`
      })
    }

    if (loadType.value === 'motor') {
      const spec = currentMotorSpec.value
      const pfText = spec ? spec.defaultPowerFactor.toString() : '0.80'
      issues.push({
        level: 'info',
        code: 'MOTOR_SPEC_APPLIED',
        title: '電動機（規約電流）計算を適用中',
        message: `選定: ${motorKw.value}kW (規約電流 ${I}A, 力率 cosθ=${pfText})。電線1.25倍/1.1倍則を適用しています。`
      })
    } else if (ignorePowerFactor.value) {
      issues.push({
        level: 'info',
        code: 'PF_IGNORED',
        title: '力率1.0（純抵抗/LED照明扱い）',
        message: 'リアクタンス成分を無視し、純抵抗（力率1.0）として電圧降下を算出しています。'
      })
    }

    return issues
  })

  const hasError = computed(() =>
    calculationIssues.value.some((issue) => issue.level === 'error')
  )

  // 電線サイズごとの判定算出（計算ロジックは CableBase に一本化）
  const availableWires = computed<ExtendedAvailableWireResult[]>(() => {
    if (hasError.value) return []

    const I = calculatedLoadCurrent.value

    // 耐熱必要電流基準 (モーター: 1.25倍/1.1倍則, 一般連続負荷: 1.25倍則)
    let requiredHeatAmp = I
    if (loadType.value === 'motor') {
      requiredHeatAmp = I <= 50 ? I * 1.25 : I * 1.1
    } else if (isContinuous.value) {
      requiredHeatAmp = I * 1.25
    }

    return CableBase.evaluateAllWireSizes({
      // 未知の systemId は従来どおり先頭定義にフォールバック
      systemId: currentSystem.value.id,
      voltage: voltage.value,
      targetDropPercent: targetPercent.value,
      current: I,
      distance: oneWayDistance.value,
      cableType: selectedCableType.value,
      ambientTemp: ambientTemp.value,
      wireCount: wireCount.value,
      powerFactor: effectivePowerFactor.value,
      requiredHeatAmp
    })
  })

  const recommendedWire = computed(() => {
    return availableWires.value.find((w) => w.isRecommended) || null
  })

  const breakerStatus = computed<BreakerStatusResult | null>(() => {
    if (hasError.value) return null

    const I = calculatedLoadCurrent.value
    let requiredCapacity = I

    if (loadType.value === 'motor') {
      requiredCapacity = I * 3.0
    } else if (isContinuous.value) {
      requiredCapacity = I * 1.25
    }

    const breakerList =
      selectedSystemId.value === '3P3W' || loadType.value === 'motor'
        ? THREE_PHASE_BREAKER_SIZES
        : BREAKER_SIZES

    const recommendedBreaker =
      breakerList.find((b) => b >= requiredCapacity) ||
      breakerList[breakerList.length - 1]

    return {
      is20AOk: recommendedBreaker <= 20,
      currentLoad: I,
      recommendedBreaker,
      message:
        recommendedBreaker <= 20
          ? '⭕ 20Aブレーカー運用可能（標準分岐回路）'
          : `⚠️ 推奨過電流遮断器容量: ${recommendedBreaker}A`
    }
  })

  return {
    calculatedLoadCurrent,
    currentSystem,
    currentCableType,
    allowDropV,
    availableWires,
    recommendedWire,
    breakerStatus,
    calculationIssues,
    hasError,
    SYSTEM_DEFINITIONS,
    MOTOR_SPECS: STANDARD_MOTOR_SPECS
  }
}