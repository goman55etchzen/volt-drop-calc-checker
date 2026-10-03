<!-- src/components/Motor/CapacitorInputSection.vue -->
<!-- 進相コンデンサ入力欄。モーターブレーカー選定時のみ入力フォームに切り替わる -->
<template>
  <div class="cap-input">
    <label class="sub-label">
      {{ stepLabel }} 進相コンデンサ（力率改善）
      <span v-if="available" class="tag tag-on">モーターブレーカー選定中</span>
    </label>

    <Transition name="switch" mode="out-in">
      <!-- A. モーターブレーカー選定時：入力フォーム -->
      <div v-if="available" key="form" class="cap-panel">
        <div class="field">
          <span class="field-label">設置</span>
          <div class="chips">
            <button
              type="button"
              :class="['chip', modelValue.enabled ? 'active' : '']"
              @click="update({ enabled: true })"
            >
              設置する
            </button>
            <button
              type="button"
              :class="['chip', !modelValue.enabled ? 'active' : '']"
              @click="update({ enabled: false })"
            >
              設置しない
            </button>
          </div>
        </div>

        <template v-if="modelValue.enabled">
          <!-- 容量の決め方 -->
          <div class="field">
            <span class="field-label">容量の決め方</span>
            <div class="chips">
              <button
                type="button"
                :class="['chip', modelValue.basis === 'standard' ? 'active' : '']"
                @click="update({ basis: 'standard' })"
              >
                標準表（内線規程）
              </button>
              <button
                type="button"
                :class="['chip', modelValue.basis === 'calc' ? 'active' : '']"
                @click="update({ basis: 'calc' })"
              >
                力率計算
              </button>
            </div>
          </div>

          <!-- 標準表：電動機区分・極数 -->
          <template v-if="modelValue.basis === 'standard'">
            <div v-if="showMotorClass" class="field">
              <span class="field-label">電動機区分</span>
              <div class="chips">
                <button
                  type="button"
                  :class="['chip', modelValue.motorClass === 'standard' ? 'active' : '']"
                  @click="update({ motorClass: 'standard' })"
                >
                  従来（トップランナー以外）
                </button>
                <button
                  type="button"
                  :class="['chip', modelValue.motorClass === 'top_runner' ? 'active' : '']"
                  @click="update({ motorClass: 'top_runner' })"
                >
                  トップランナー（IE3）
                </button>
              </div>
              <p class="hint">
                2015年以降に出荷された高効率（IE3）モータは「トップランナー」を選択してください。
              </p>
            </div>

            <div v-if="showPoles" class="field">
              <span class="field-label">極数</span>
              <div class="chips">
                <button
                  v-for="p in polesOptions"
                  :key="p"
                  type="button"
                  :class="['chip', modelValue.poles === p ? 'active' : '']"
                  @click="update({ poles: p })"
                >
                  {{ p }}極
                </button>
              </div>
            </div>
          </template>

          <!-- 力率計算：力率・効率 -->
          <template v-else>
            <div class="field">
              <span class="field-label">現在力率 cosθ</span>
              <div class="chips">
                <button
                  type="button"
                  :class="['chip', modelValue.autoPowerFactor ? 'active' : '']"
                  @click="update({ autoPowerFactor: true })"
                >
                  自動（出力連動）
                </button>
                <button
                  v-for="pf in currentPfPresets"
                  :key="pf"
                  type="button"
                  :class="[
                    'chip',
                    !modelValue.autoPowerFactor && modelValue.powerFactor === pf
                      ? 'active'
                      : '',
                  ]"
                  @click="update({ powerFactor: pf, autoPowerFactor: false })"
                >
                  {{ pf }}
                </button>
              </div>
              <p class="hint">現在値: {{ modelValue.powerFactor }}</p>
            </div>

            <div class="field">
              <span class="field-label">目標力率 cosθ</span>
              <div class="chips">
                <button
                  v-for="pf in targetPfPresets"
                  :key="pf"
                  type="button"
                  :class="[
                    'chip',
                    modelValue.targetPowerFactor === pf ? 'active' : '',
                  ]"
                  @click="update({ targetPowerFactor: pf })"
                >
                  {{ pf }}
                </button>
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="cap-eff">電動機効率 η</label>
              <input
                id="cap-eff"
                type="number"
                class="text-input"
                min="0.5"
                max="1"
                step="0.01"
                :value="modelValue.efficiency"
                @input="onEfficiency(($event.target as HTMLInputElement).value)"
              />
            </div>
          </template>

          <p v-if="warning" class="warn">⚠️ {{ warning }}</p>
          <p v-if="notice" class="info">ℹ️ {{ notice }}</p>

          <div v-if="!warning" class="preview">
            <div>
              <span class="preview-title">{{ sourceTitle }}</span>
              <span class="preview-value">{{ targetUf }} μF</span>
            </div>
            <div>
              <span class="preview-title">無効電力（参考）</span>
              <span class="preview-value">{{ targetKvar }} kvar</span>
            </div>
          </div>
          <p v-if="!warning && tableLabel" class="hint">
            根拠: {{ tableLabel }}（内線規程 3335節）
          </p>
          <p
            v-if="!warning && source === 'standard' && formulaUf > 0"
            class="hint"
          >
            参考: 力率計算の場合は約 {{ formulaUf }} μF（{{ requiredKvar }} kvar）。標準表は電動機の無負荷無効分を超えない値に設定されています。
          </p>
        </template>
        <p v-else class="hint">
          コンデンサを設置しない場合、結果欄のコンデンサ表示は非表示になります。
        </p>
      </div>

      <!-- B. それ以外：ロック表示 -->
      <div v-else key="locked" class="cap-locked">
        <span class="lock-icon">🔒</span>
        <p>{{ reason }}</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CapacitorInputState, CapacitorTargetSource } from "@/composables/useCapacitorInput";

const props = withDefaults(
  defineProps<{
    modelValue: CapacitorInputState;
    /** モーターブレーカー選定中（入力可能）か */
    available: boolean;
    /** 入力不可の理由 */
    reason?: string;
    /** 力率の警告文 */
    warning?: string;
    /** 標準表の補足案内 */
    notice?: string;
    /** 電動機区分/極数の入力を出すか */
    showMotorClass?: boolean;
    showPoles?: boolean;
    /** 採用容量 */
    targetUf?: number;
    targetKvar?: number;
    /** 力率計算の参考値 */
    formulaUf?: number;
    requiredKvar?: number;
    /** 容量の根拠 */
    source?: CapacitorTargetSource;
    tableLabel?: string;
    stepLabel?: string;
  }>(),
  {
    reason: "",
    warning: "",
    notice: "",
    showMotorClass: false,
    showPoles: false,
    targetUf: 0,
    targetKvar: 0,
    formulaUf: 0,
    requiredKvar: 0,
    source: "standard",
    tableLabel: "",
    stepLabel: "9.",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: Partial<CapacitorInputState>): void;
}>();

const currentPfPresets = [0.7, 0.75, 0.8, 0.85, 0.9];
const targetPfPresets = [0.9, 0.95, 1.0];
const polesOptions = [2, 4, 6] as const;

const sourceTitle = computed(() =>
  props.source === "standard" ? "取付標準容量" : "必要静電容量（計算）",
);

const update = (patch: Partial<CapacitorInputState>) =>
  emit("update:modelValue", patch);

const onEfficiency = (raw: string) => {
  const v = Number(raw);
  if (v >= 0.5 && v <= 1) update({ efficiency: v });
};
</script>

<style scoped>
.cap-input { display: flex; flex-direction: column; }
.sub-label { display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; }
.tag { font-size: 11px; font-weight: 600; margin-left: 8px; padding: 2px 8px; border-radius: 10px; }
.tag-on { color: #34d399; background: rgba(52,211,153,.12); border: 1px solid #34d399; }

.cap-panel, .cap-locked { border-radius: 12px; padding: 16px; box-sizing: border-box; }
.cap-panel { background: #162032; border: 1px solid #0284c7; display: flex; flex-direction: column; gap: 14px; }
.cap-locked { background: #0f172a; border: 1px dashed #475569; display: flex; gap: 10px; align-items: flex-start; color: #94a3b8; font-size: 13px; }
.cap-locked p { margin: 0; line-height: 1.6; }
.lock-icon { font-size: 18px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { min-height: 36px; padding: 6px 14px; border-radius: 8px; border: 1px solid #475569; background: #1e293b; color: #38bdf8; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s ease; }
.chip:hover { border-color: #0284c7; }
.chip.active { background: #0284c7; color: #fff; border-color: #38bdf8; box-shadow: 0 0 10px rgba(2,132,199,.4); }
.text-input { width: 100%; height: 44px; padding: 0 12px; border-radius: 8px; border: 1px solid #475569; background: #334155; color: #fff; font-size: 16px; box-sizing: border-box; }
.text-input:focus { outline: none; border-color: #38bdf8; }

.info { margin: 0; padding: 10px 12px; font-size: 13px; color: #bae6fd; background: rgba(2,132,199,.12); border-left: 4px solid #0284c7; border-radius: 6px; }
.hint { margin: 0; font-size: 12px; color: #94a3b8; }
.warn { margin: 0; padding: 10px 12px; font-size: 13px; color: #fde68a; background: rgba(245,158,11,.12); border-left: 4px solid #f59e0b; border-radius: 6px; }
.preview { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #0d1526; border: 1px solid #2d3d54; border-radius: 10px; padding: 12px; }
.preview > div { display: flex; flex-direction: column; gap: 2px; }
.preview-title { font-size: 11px; color: #94a3b8; }
.preview-value { font-size: 18px; font-weight: 700; color: #38bdf8; }

/* 切替アニメーション */
.switch-enter-active, .switch-leave-active { transition: opacity .2s ease, transform .2s ease; }
.switch-enter-from { opacity: 0; transform: translateY(8px); }
.switch-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
