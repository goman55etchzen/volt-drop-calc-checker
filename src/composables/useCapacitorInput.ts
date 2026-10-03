// src/composables/useCapacitorInput.ts
//
// 進相コンデンサの「入力項目」を管理する。
// 保護遮断器が【モーターブレーカー】に選定されたときだけ入力欄が有効になり、
// MCCB（配線用遮断器）／インバータ駆動のときは入力欄がロック表示に切り替わる。
//
// 容量の決め方（basis）
//  - standard : 内線規程の取付標準容量表（電動機区分・極数で選択）…既定
//  - calc     : 現在力率→目標力率の計算式
import { reactive, computed, watch, type Ref } from "vue";
import type {
  MotorClass,
  MotorPoles,
  StandardCapacitorResult,
} from "@/base/capacitorStandard";

export type CapacitorBreakerType = "motor_breaker" | "mccb";
export type CapacitorBasisMode = "standard" | "calc";
export type CapacitorTargetSource = "standard" | "formula" | "formula_fallback";

export interface CapacitorInputState {
  /** コンデンサを設置する（力率改善を行う） */
  enabled: boolean;
  /** 容量の決め方 */
  basis: CapacitorBasisMode;
  /** 電動機区分（標準表・三相のみ） */
  motorClass: MotorClass;
  /** 極数（トップランナー表のみ） */
  poles: MotorPoles;
  /** 現在力率を電動機出力から自動設定する（計算式モード） */
  autoPowerFactor: boolean;
  /** 現在力率 cosθ */
  powerFactor: number;
  /** 目標力率 cosθ */
  targetPowerFactor: number;
  /** 電動機効率 η */
  efficiency: number;
}

export interface UseCapacitorInputOptions {
  /** 駆動方式 */
  driveMode: Ref<"direct" | "inverter">;
  /** 選定済みの保護遮断器種別（auto の場合も選定結果が入る） */
  breakerType: Ref<CapacitorBreakerType>;
  /** 電動機出力 [kW] */
  motorKw: Ref<number | null>;
  /** useMotorCalc / useCapacitor が参照する Ref（ここから書き込む） */
  powerFactor: Ref<number>;
  targetPowerFactor: Ref<number>;
  efficiency: Ref<number>;
  basis: Ref<CapacitorBasisMode>;
  motorClass: Ref<MotorClass>;
  poles: Ref<MotorPoles>;
  /** 三相か（標準表の電動機区分/極数は三相のみ） */
  isThreePhase: Ref<boolean>;
  /** useCapacitor の算出結果（表示用） */
  requiredKvar: Ref<number>;
  formulaUf: Ref<number>;
  targetUf: Ref<number>;
  targetKvar: Ref<number>;
  standardCapacitor: Ref<StandardCapacitorResult | null>;
  targetSource: Ref<CapacitorTargetSource>;
}

/** 出力に応じた標準力率（useMotorCalc.setPreset と同じ基準） */
export function presetPowerFactor(kw: number): number {
  if (kw <= 2.2) return 0.8;
  if (kw <= 7.5) return 0.85;
  return 0.88;
}

export function useCapacitorInput(opts: UseCapacitorInputOptions) {
  const state = reactive<CapacitorInputState>({
    enabled: true,
    basis: opts.basis.value,
    motorClass: opts.motorClass.value,
    poles: opts.poles.value,
    autoPowerFactor: true,
    powerFactor: opts.powerFactor.value,
    targetPowerFactor: opts.targetPowerFactor.value,
    efficiency: opts.efficiency.value,
  });

  /** コンデンサ入力が有効になる条件：直結駆動 かつ モーターブレーカー選定 */
  const isAvailable = computed(
    () =>
      opts.driveMode.value === "direct" &&
      opts.breakerType.value === "motor_breaker",
  );

  const unavailableReason = computed(() => {
    if (opts.driveMode.value === "inverter") {
      return "インバータ駆動では進相コンデンサを設置できません（二次側は設置不可）。";
    }
    if (opts.breakerType.value !== "motor_breaker") {
      return "配線用遮断器（MCCB）選定中は入力できません。保護遮断器を「モーターブレーカー」にすると、進相コンデンサの入力項目が表示されます。";
    }
    return "";
  });

  /** 入力が有効 かつ 設置する → 結果側にコンデンサを表示 */
  const isActive = computed(() => isAvailable.value && state.enabled);

  /** 電動機区分・極数の入力を表示するか（標準表・三相のみ） */
  const showMotorClass = computed(
    () => state.basis === "standard" && opts.isThreePhase.value,
  );
  const showPoles = computed(
    () => showMotorClass.value && state.motorClass === "top_runner",
  );

  const pfWarning = computed(() => {
    if (!isActive.value || state.basis !== "calc") return "";
    if (state.powerFactor >= state.targetPowerFactor) {
      return "現在力率が目標力率以上のため、力率改善（コンデンサ）は不要です。";
    }
    return "";
  });

  /** 標準表を使えなかった場合の案内 */
  const basisNotice = computed(() => {
    if (!isActive.value || state.basis !== "standard") return "";
    if (opts.targetSource.value === "formula_fallback") {
      return "この出力・電圧は標準表の対象外のため、力率計算の値を表示しています。";
    }
    const s = opts.standardCapacitor.value;
    if (s && !s.exact) {
      return `出力に一致する行がないため、上位の ${s.matchedKw}kW の行を採用しています。`;
    }
    return s?.note ?? "";
  });

  // 入力 → useMotorCalc / useCapacitor の Ref へ反映
  watch(() => state.powerFactor, (v) => (opts.powerFactor.value = v), { immediate: true });
  watch(() => state.targetPowerFactor, (v) => (opts.targetPowerFactor.value = v), { immediate: true });
  watch(() => state.efficiency, (v) => (opts.efficiency.value = v), { immediate: true });
  watch(() => state.basis, (v) => (opts.basis.value = v), { immediate: true });
  watch(() => state.motorClass, (v) => (opts.motorClass.value = v), { immediate: true });
  watch(() => state.poles, (v) => (opts.poles.value = v), { immediate: true });

  // 現在力率の自動設定（出力連動）
  watch(
    [() => opts.motorKw.value, () => state.autoPowerFactor],
    ([kw, auto]) => {
      if (auto && kw && kw > 0) state.powerFactor = presetPowerFactor(kw);
    },
    { immediate: true },
  );

  /** 現在力率を手動指定（自動設定は解除） */
  const setPowerFactor = (pf: number) => {
    state.autoPowerFactor = false;
    state.powerFactor = pf;
  };

  /** 親が保持する状態へ部分更新を反映 */
  const patch = (p: Partial<CapacitorInputState>) => {
    if (p.powerFactor !== undefined && p.autoPowerFactor === undefined) {
      state.autoPowerFactor = false;
    }
    Object.assign(state, p);
  };

  return {
    state,
    isAvailable,
    isActive,
    unavailableReason,
    showMotorClass,
    showPoles,
    pfWarning,
    basisNotice,
    requiredKvar: opts.requiredKvar,
    formulaUf: opts.formulaUf,
    targetUf: opts.targetUf,
    targetKvar: opts.targetKvar,
    standardCapacitor: opts.standardCapacitor,
    targetSource: opts.targetSource,
    setPowerFactor,
    patch,
  };
}

export type UseCapacitorInputReturn = ReturnType<typeof useCapacitorInput>;
