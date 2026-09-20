<!-- src/views/MotorCalc.vue -->
<template>
  <div class="motor-calc-container">
    <!-- 左側：入力フォームセクション（全開放型） -->
    <div class="input-section">
      <div class="form-card">
        <div class="card-header mb-4">
          <span class="card-title">⚙️ 電動機（モーター）負荷計算</span>
        </div>
        
        <div class="form-list">
          <!-- 1. 周波数 (localDb連携) -->
          <div class="input-group">
            <label class="sub-label">
              1. 周波数
              <span class="saved-badge" v-if="isFreqSaved">（地域設定保存済み）</span>
            </label>
            <div class="preset-chips">
              <button 
                type="button" 
                :class="['chip-btn', formData.frequency === 50 ? 'active' : '']" 
                @click="updateFrequency(50)"
              >
                50Hz
              </button>
              <button 
                type="button" 
                :class="['chip-btn', formData.frequency === 60 ? 'active' : '']" 
                @click="updateFrequency(60)"
              >
                60Hz
              </button>
            </div>
          </div>

          <!-- 2. 相・線間電圧 -->
          <div class="input-group">
            <label class="sub-label">2. 相・線間電圧</label>
            <div class="preset-chips">
              <button type="button" :class="['chip-btn', formData.systemId === '1P3W_100V' ? 'active' : '']" @click="formData.systemId = '1P3W_100V'">単相100V</button>
              <button type="button" :class="['chip-btn', formData.systemId === '1P3W_200V' ? 'active' : '']" @click="formData.systemId = '1P3W_200V'">単相200V</button>
              <button type="button" :class="['chip-btn', formData.systemId === '3P3W' ? 'active' : '']" @click="formData.systemId = '3P3W'">三相200V (動力)</button>
            </div>
          </div>

          <!-- 3. 電動機出力 -->
          <div class="input-group">
            <label class="sub-label">3. 電動機定格出力 (kW)</label>
            <div class="preset-chips mb-2">
              <button v-for="kw in [0.4, 0.75, 1.5, 2.2, 3.7, 5.5]" :key="kw" 
                      type="button" 
                      :class="['chip-btn', formData.motorKw === kw ? 'active' : '']" 
                      @click="formData.motorKw = kw">{{ kw }}</button>
            </div>
            <input type="number" class="text-input" v-model.number="formData.motorKw" step="0.1" placeholder="直接入力 (例: 3.7)">
          </div>

          <!-- 4. 台数 -->
          <div class="input-group">
            <label class="sub-label">4. 電動機台数</label>
            <div class="preset-chips mb-2">
              <button v-for="cnt in [1, 2, 3, 4, 5]" :key="cnt" 
                      type="button" 
                      :class="['chip-btn', formData.quantity === cnt ? 'active' : '']" 
                      @click="formData.quantity = cnt">{{ cnt }}台</button>
            </div>
            <input type="number" class="text-input" v-model.number="formData.quantity" min="1" placeholder="直接入力 (例: 1)">
          </div>

          <!-- 5. その他合算負荷 -->
          <div class="input-group">
            <label class="sub-label">5. その他一般負荷 Ir (A)</label>
            <input type="number" class="text-input" v-model.number="formData.otherLoadIr" min="0" placeholder="ない場合は 0 を入力">
          </div>

          <!-- 6. 環境条件 -->
          <div class="input-group">
             <SelectEnvironment v-model="formData.environment" />
          </div>

          <!-- 7. 駆動方式 -->
          <div class="input-group">
            <label class="sub-label">7. 駆動方式選択</label>
            <div class="preset-chips">
              <button type="button" :class="['chip-btn', formData.driveMode === 'direct' ? 'active' : '']" @click="formData.driveMode = 'direct'">商用電源直結 (通常)</button>
              <button type="button" :class="['chip-btn', formData.driveMode === 'inverter' ? 'active' : '']" @click="formData.driveMode = 'inverter'">インバータ駆動</button>
            </div>
          </div>

          <!-- 8. 遮断器種別 -->
          <div class="input-group">
            <label class="sub-label">8. 保護遮断器 種別</label>
            <div class="preset-chips">
              <button type="button" :class="['chip-btn', formData.breakerMode === 'auto' ? 'active' : '']" @click="formData.breakerMode = 'auto'">自動選定</button>
              
              <button type="button" 
                      :class="['chip-btn', formData.breakerMode === 'motor_breaker' ? 'active' : '']" 
                      :disabled="formData.driveMode === 'inverter'"
                      :title="formData.driveMode === 'inverter' ? 'インバータ駆動時は選択できません' : ''"
                      @click="formData.driveMode !== 'inverter' && (formData.breakerMode = 'motor_breaker')">
                モーターブレーカー
              </button>

              <button type="button" :class="['chip-btn', formData.breakerMode === 'mccb' ? 'active' : '']" @click="formData.breakerMode = 'mccb'">配線用遮断器 (MCCB)</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右側：結果表示セクション -->
    <div class="result-section">
      <!-- 1. 入力未完了時案内 -->
      <div v-if="!canCalculateBasic" class="empty-state form-card">
        <span class="card-title text-slate-400">算出待機中</span>
        <p class="mt-4 text-sm text-slate-500">「周波数」「相・電圧」「出力 (kW)」を選択すると定格電流が計算されます。</p>
      </div>

      <!-- 2. 右側の算出結果はNotice.vueに一元化 -->
      <Notice
        v-else
        :drive-mode="formData.driveMode"
        :calculated-amp="mc.calculatedAmp.value"
        :display-total-load-amp="mc.totalLoadAmp.value"
        :motor-count="formData.quantity || 1"
        :other-load-amp="formData.otherLoadIr || 0"
        :voltage="mc.voltage.value"
        :motor-kw="formData.motorKw || 0"
        :show-details="canCalculateFull"
        v-model:powerFactor="mc.powerFactor.value"
        v-model:targetPowerFactor="mc.targetPowerFactor.value"
        v-model:efficiency="mc.efficiency.value"
        :breaker-info="mc.breakerInfo.value"
        :elcb-info="mc.elcbInfo.value"
        :recommended-installation="recommendedInstallation"
        :recommended-capacitors="recommendedCapacitors"
        :thermal-info="thermalInfo"
      />

      <div v-if="canCalculateBasic && !canCalculateFull" class="info-card mt-3">
        <p class="text-xs text-slate-400">※「環境条件」「駆動方式」「保護遮断器種別」を選択すると詳細な機器選定結果が表示されます。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import SelectEnvironment from '@/components/Motor/SelectEnvironment.vue';
import Notice from '@/components/common/Notice.vue';
import { useMotorCalc } from '@/composables/useMotorCalc';
import { useThermal } from '@/composables/useThermal';
import { localDb } from '@/utils/localDb';
import type { 
  PowerFrequency, 
  EnvironmentType, 
  MotorBreakerType 
} from '@/types/appDefinitions';
import { fetchCapacitorCatalog, findClosestCapacitorGroup } from '@/utils/capacitor';
import type { CapacitorProduct } from '@/utils/capacitor';

const mc = useMotorCalc();
const isTotalAmpOpen = ref(true);
const isPowerFactorOpen = ref(true);
const isFreqSaved = ref(false);

const capacitorCatalog = ref<CapacitorProduct[]>([]);

// フォーム保持オブジェクト（初期値は全て null とし、算出用デフォルト値の混入を防止）
const formData = reactive({
  frequency: null as PowerFrequency | null,
  systemId: null as string | null,
  motorKw: null as number | null,
  quantity: null as number | null,
  otherLoadIr: null as number | null,
  environment: null as EnvironmentType | null,
  driveMode: null as 'direct' | 'inverter' | null,
  breakerMode: null as MotorBreakerType | null,
});

onMounted(async () => {
  capacitorCatalog.value = await fetchCapacitorCatalog();
  
  // localDbから周波数を復元
  const savedFreq = localDb.getFrequency();
  if (savedFreq) {
    formData.frequency = savedFreq;
    mc.frequency.value = savedFreq;
    isFreqSaved.value = true;
  }
});

/** 周波数を更新し、localDbに永続化保存 */
const updateFrequency = (freq: PowerFrequency) => {
  formData.frequency = freq;
  mc.frequency.value = freq;
  localDb.setFrequency(freq);
  isFreqSaved.value = true;
};

// watchによるComposable側状態への安全な同期 (null の場合は安全なデフォルト数値へフォールバック)
watch(() => formData.motorKw, (val) => { mc.outputKw.value = val ?? 0; });
watch(() => formData.quantity, (val) => { mc.motorCount.value = val ?? 1; });
watch(() => formData.otherLoadIr, (val) => { mc.otherLoadAmp.value = val ?? 0; });
watch(() => formData.environment, (val) => { if (val) mc.environment.value = val; });
watch(() => formData.driveMode, (val) => { 
  if (val) mc.driveMode.value = val;
  if (val === 'inverter' && formData.breakerMode === 'motor_breaker') {
    formData.breakerMode = 'auto';
  }
});
watch(() => formData.breakerMode, (val) => { if (val) mc.breakerTypeMode.value = val; });
watch(() => formData.systemId, (val) => {
  if (val === '1P3W_100V') mc.voltage.value = 100;
  if (val === '1P3W_200V' || val === '3P3W') mc.voltage.value = 200;
});

const { thermalInfo } = useThermal(mc.calculatedAmp, mc.driveMode, mc.motorCount);

// --- 計算状態フラグ ---
/** 1. 1台あたりの定格電流を計算できる最低条件 */
const canCalculateBasic = computed(() => {
  return formData.frequency !== null && formData.systemId !== null && formData.motorKw !== null && formData.motorKw > 0;
});

/** 2. ブレーカーやサーマル等の詳細選定を算出できるフル条件 */
const canCalculateFull = computed(() => {
  return canCalculateBasic.value && formData.environment !== null && formData.driveMode !== null && formData.breakerMode !== null;
});

const recommendedInstallation = computed(() => {
  if (!formData.systemId || !formData.driveMode) return '';
  let txt = 'D種接地工事 (使用電圧300V以下)';
  if (formData.driveMode === 'inverter') {
    txt += '\n※インバータ駆動時のノイズ対策として、二次側配線にはシールド付きケーブル（CV-S等）の使用と、インバータ専用配線工事を推奨します。';
  }
  return txt;
});

const recommendedCapacitors = computed(() => {
  if (!formData.motorKw || !formData.frequency || !mc.voltage.value || capacitorCatalog.value.length === 0) return [];
  
  const P = formData.motorKw;
  const pf1 = mc.powerFactor.value || 0.85;
  const pf2 = mc.targetPowerFactor.value || 0.95;
  const f = formData.frequency;
  const V = mc.voltage.value;
  const eff = mc.efficiency.value || 0.85;
  
  const acos1 = Math.acos(pf1);
  const acos2 = Math.acos(pf2);
  const kvar = (P / eff) * (Math.tan(acos1) - Math.tan(acos2));
  
  if (kvar <= 0) return [];
  
  const cFarad = (kvar * 1000) / (2 * Math.PI * f * Math.pow(V, 2));
  const targetUf = cFarad * 1000000;

  return findClosestCapacitorGroup(capacitorCatalog.value, V, f, targetUf);
});
</script>

<style scoped>
/* ベース構造 */
.motor-calc-container { 
  display: flex; 
  flex-direction: column; 
  gap: 2rem; 
  width: 100%; 
  max-width: 1200px; 
  margin: 0 auto; 
  box-sizing: border-box; 
}
.input-section, .result-section { 
  width: 100%; 
  display: flex; 
  flex-direction: column; 
  gap: 1rem; 
}

@media (min-width: 992px) {
  .motor-calc-container { flex-direction: row; align-items: flex-start; }
  .input-section { flex: 1.2; min-width: 450px; }
  .result-section { flex: 1; min-width: 350px; position: sticky; top: 2rem; }
}

/* フォームパーツ */
.form-card {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 24px;
}
.card-header {
  border-bottom: 1px solid #1e293b;
  padding-bottom: 12px;
}
.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #f8fafc;
}
.input-group { 
  display: flex; 
  flex-direction: column; 
  margin-bottom: 24px; 
}
.sub-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 8px;
}
.saved-badge {
  font-size: 11px;
  color: #38bdf8;
  margin-left: 8px;
  font-weight: normal;
}
.text-input {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #334155;
  color: #ffffff;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.text-input:focus {
  outline: none;
  border-color: #38bdf8;
}
.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip-btn {
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #38bdf8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chip-btn:hover { border-color: #0284c7; }
.chip-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.4);
}
.chip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: #334155;
  background-color: #0f172a;
  color: #64748b;
  box-shadow: none;
}


.empty-state { 
  text-align: center; 
  padding: 3rem 1rem; 
}
.info-card {
  background-color: #0f172a;
  border: 1px dashed #334155;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
</style>