<!-- src/components/selected1.vue -->
<template>
  <div class="selected-container">
    <!-- 1. 電源周波数 (最上部に独立したトグルスイッチ) -->
    <div class="input-group frequency-section">
      <label class="sub-label">電源周波数</label>
      <div class="toggle-switch-group">
        <button
          type="button"
          :class="['toggle-btn', frequency === 50 ? 'active' : '']"
          @click="frequency = 50"
        >
          50 Hz <span class="sub-text">(東日本)</span>
        </button>
        <button
          type="button"
          :class="['toggle-btn', frequency === 60 ? 'active' : '']"
          @click="frequency = 60"
        >
          60 Hz <span class="sub-text">(西日本)</span>
        </button>
      </div>
    </div>

    <!-- 2. 電圧仕様・相数 & 設置環境 -->
    <div class="responsive-grid grid-2 mt-12">
      <!-- 線間電圧（2P/3P 連動・400/440Vは三相限定） -->
      <div class="input-group">
        <label class="sub-label">電源方式・線間電圧 (V)</label>
        <!-- @change を削除し、watch でリアクティブに状態同期を処理 -->
        <select v-model="selectedVoltageKey" class="select-input">
          <option value="1ph-200">単相 200V (2P)</option>
          <option value="3ph-200">三相 200V (3P)</option>
          <option value="3ph-220">三相 220V (3P)</option>
          <option value="3ph-400">三相 400V (3P ※国内は三相のみ)</option>
          <option value="3ph-440">三相 440V (3P ※国内は三相のみ)</option>
        </select>
      </div>

      <!-- 設置環境条件 -->
      <div class="input-group">
        <label class="sub-label">設置環境条件</label>
        <select v-model="environment" class="select-input">
          <option value="normal">一般乾燥場所</option>
          <option value="enclosure">鉄箱・金属外箱内</option>
          <option value="wet">水気・湿気のある場所</option>
        </select>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EnvironmentType, PowerFrequency } from '@/types/appDefinitions';

const voltage = defineModel<number>('voltage', { required: true });
const frequency = defineModel<PowerFrequency>('frequency', { required: true });
const environment = defineModel<EnvironmentType>('environment', { required: true });

// 2P/3Pと電圧をまとめたキー管理
const selectedVoltageKey = ref<string>('3ph-200');

// 1. 親コンポーネント側からの voltage 変更を検知してセレクトボックスを同期
watch(voltage, (newVal) => {
  if (newVal === 200) {
    if (!selectedVoltageKey.value.includes('200')) {
      selectedVoltageKey.value = '3ph-200';
    }
  } else if (newVal === 220) {
    selectedVoltageKey.value = '3ph-220';
  } else if (newVal === 400) {
    selectedVoltageKey.value = '3ph-400';
  } else if (newVal === 440) {
    selectedVoltageKey.value = '3ph-440';
  }
}, { immediate: true });

// 2. ユーザーのセレクトボックス操作を検知して親の voltage に反映
watch(selectedVoltageKey, (newKey) => {
  switch (newKey) {
    case '1ph-200':
    case '3ph-200':
      voltage.value = 200;
      break;
    case '3ph-220':
      voltage.value = 220;
      break;
    case '3ph-400':
      voltage.value = 400;
      break;
    case '3ph-440':
      voltage.value = 440;
      break;
  }
});
</script>
  
<style scoped>
.selected-container {
  background-color: #1e293b;
  padding: 12px;
  border-radius: 8px;
}

.frequency-section {
  display: flex;
  flex-direction: column;
}

.toggle-switch-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background-color: #0f172a;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #475569;
}

.toggle-btn {
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.sub-text {
  font-size: 11px;
  opacity: 0.8;
}

.responsive-grid {
  display: grid;
  gap: 10px;
}
  
.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}
  
.input-group {
  display: flex;
  flex-direction: column;
}
  
.sub-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
}
  
.select-input {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #334155;
  color: #ffffff;
  font-size: 15px;
  box-sizing: border-box;
}
  
@media (max-width: 640px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

/* --- PC用レスポンシブ --- */
@media (min-width: 768px) {
  .selected-container {
    padding: 24px;
  }
  .grid-2 {
    gap: 24px;
  }
  .toggle-switch-group {
    display: flex;
    justify-content: center;
    max-width: 400px;
    margin: 0 auto;
  }
  .toggle-btn {
    flex: 1;
    height: 48px;
    font-size: 16px;
  }
  .sub-label {
    font-size: 14px;
  }
  .select-input {
    font-size: 16px;
    height: 52px;
  }
}
</style>