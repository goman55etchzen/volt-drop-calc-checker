import { computed, Ref } from 'vue'
import {
  AppMode,
  CalculationInputMode,
  LoadType,
  InstallationType,
  CableTypeCode,
  SystemType,
  MotorSpec,
  CableSpec,
  AvailableWireResult,
  BreakerStatusResult,
  CalculationIssue,
  SYSTEM_DEFINITIONS,
  MOTOR_SPECS,
  CABLE_SPECS,
  REDUCTION_FACTORS,
  BREAKER_SIZES
} from '@/types/appDefinitions'

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
  isContinuous: Ref<boolean>
) {
  // 選択中の配線方式を取得
  const currentSystem = computed<SystemType>(() => {
    return (
      SYSTEM_DEFINITIONS.find((s) => s.id === selectedSystemId.value) ||
      SYSTEM_DEFINITIONS[0]
    )
  })

  // 有効力率 (LED・純抵抗モードオン時は 1.0)
  const effectivePowerFactor = computed(() => {
    return ignorePowerFactor.value ? 1.0 : powerFactor.value
  })

  // 負荷電流 (W入力、A直接入力、モーター規約電流を自動分岐算出)
  const calculatedLoadCurrent = computed(() => {
    if (loadType.value === 'motor') {
      const spec = MOTOR_SPECS.find((m) => m.kw === motorKw.value)
      return spec ? spec.amp : 4.8
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

  // 敷設方式の電流低減係数
  const currentReductionFactor = computed(() => {
    return REDUCTION_FACTORS[installationType.value] ?? 0.7
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

    if (loadType.value === 'motor') {
      const spec = MOTOR_SPECS.find((m) => m.kw === motorKw.value)
      const pfText = spec ? spec.defaultCosTheta.toString() : '0.80'
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

  // 電線サイズごとの判定算出
  const availableWires = computed<AvailableWireResult[]>(() => {
    if (hasError.value) return []

    const L = oneWayDistance.value
    const e_allow = allowDropV.value
    const sys = currentSystem.value
    const I = calculatedLoadCurrent.value
    const cosTheta = effectivePowerFactor.value
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta))

    // モーター時の耐熱必要電流基準 (1.25倍 / 1.1倍則)
    const requiredWireAmp =
      loadType.value === 'motor' ? (I <= 50 ? I * 1.25 : I * 1.1) : I

    return CABLE_SPECS.map((spec) => {
      // 力率無視の場合は R のみ、通常は Rcosθ + Xsinθ
      const z = ignorePowerFactor.value
        ? spec.r
        : spec.r * cosTheta + spec.x * sinTheta

      const maxAmpereByDrop =
        z > 0 ? (e_allow * 1000) / (sys.kFactor * z * L) : 0
      const baseAllow = spec.baseAllowAmp[selectedCableType.value]
      const allowAmpereByHeat = baseAllow * currentReductionFactor.value
      const effectiveMaxAmp = Math.min(maxAmpereByDrop, allowAmpereByHeat)

      return {
        wireName: spec.size,
        area: spec.area,
        maxAmpereByDrop: Number(maxAmpereByDrop.toFixed(1)),
        allowAmpereByHeat: Number(allowAmpereByHeat.toFixed(1)),
        effectiveMaxAmp: Number(effectiveMaxAmp.toFixed(1)),
        isOkForLoad:
          effectiveMaxAmp >= I && allowAmpereByHeat >= requiredWireAmp
      }
    })
  })

  // 送る側ブレーカー判定
  const breakerStatus = computed<BreakerStatusResult | null>(() => {
    if (hasError.value) return null

    const I = calculatedLoadCurrent.value
    let requiredCapacity = I

    if (loadType.value === 'motor') {
      requiredCapacity = I * 3.0
    } else if (isContinuous.value) {
      requiredCapacity = I * 1.25
    }

    const recommendedBreaker =
      BREAKER_SIZES.find((b) => b >= requiredCapacity) ||
      BREAKER_SIZES[BREAKER_SIZES.length - 1]

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
    allowDropV,
    availableWires,
    breakerStatus,
    calculationIssues,
    hasError,
    SYSTEM_DEFINITIONS,
    MOTOR_SPECS
  }
}