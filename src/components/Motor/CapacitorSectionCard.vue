<!-- src/components/CapacitorSectionCard.vue -->
<template>
  <div>
    <!-- 画面右端の中央下部に固定するスライドトリガーボタン -->
    <button 
      type="button" 
      class="side-trigger-btn-pf"
      @click="$emit('update:isOpen', true)"
      aria-label="力率・効率の詳細設定を表示"
    >
      <span class="trigger-icon">◀</span>
      <span class="trigger-label">力率・効率</span>
      <span class="trigger-value-mini">{{ powerFactor }}</span>
    </button>

    <!-- 背景の半透明オーバーレイ -->
    <div 
      v-if="isOpen" 
      class="slide-overlay"
      @click="$emit('update:isOpen', false)"
    ></div>

    <!-- 横からスライドインするカード -->
    <div :class="['slide-drawer-card', { open: isOpen }]">
      <div class="drawer-header">
        <span class="card-title">⚙️ 力率・効率 詳細設定</span>
        <button type="button" class="close-btn" @click="$emit('update:isOpen', false)">✕</button>
      </div>

      <div class="drawer-body">
        <div class="input-group">
          <label class="sub-label">現状力率 cosθ</label>
          <input
            :value="powerFactor"
            @input="$emit('update:powerFactor', Number(($event.target as HTMLInputElement).value))"
            type="number"
            step="0.01"
            min="0.5"
            max="1.0"
            class="text-input"
          />
        </div>

        <div class="input-group">
          <label class="sub-label">目標力率 cosθ</label>
          <input
            :value="targetPowerFactor"
            @input="$emit('update:targetPowerFactor', Number(($event.target as HTMLInputElement).value))"
            type="number"
            step="0.01"
            min="0.8"
            max="1.0"
            class="text-input"
          />
        </div>

        <div class="input-group">
          <label class="sub-label">効率 η (エータ)</label>
          <input
            :value="efficiency"
            @input="$emit('update:efficiency', Number(($event.target as HTMLInputElement).value))"
            type="number"
            step="0.01"
            min="0.5"
            max="1.0"
            class="text-input"
          />
        </div>

        <div class="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700 text-xs text-slate-300 space-y-1">
          <div>※ 通常はデフォルト値（現状 0.85 / 目標 0.95 / 効率 0.85）のままで実用上問題ありません。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  powerFactor: number;
  targetPowerFactor: number;
  efficiency: number;
}>();

defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'update:powerFactor', value: number): void;
  (e: 'update:targetPowerFactor', value: number): void;
  (e: 'update:efficiency', value: number): void;
}>();
</script>

<style scoped>
/* --- サイドトリガーボタン（Irボタンの下に配置するため top を調整） --- */
.side-trigger-btn-pf {
  position: fixed;
  right: 0;
  top: 55%;
  transform: translateY(-50%);
  z-index: 40;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  border: 1px solid #38bdf8;
  border-right: none;
  border-radius: 8px 0 0 8px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s ease, background-color 0.2s ease;
  touch-action: manipulation;
}

.side-trigger-btn-pf:active {
  background: #0369a1;
  transform: translateY(-50%) scale(0.95);
}

.trigger-icon {
  font-size: 10px;
  color: #38bdf8;
}

.trigger-label {
  font-size: 10px;
  writing-mode: vertical-rl;
  letter-spacing: 1px;
  font-weight: bold;
}

.trigger-value-mini {
  font-size: 10px;
  font-weight: 800;
  color: #4ade80;
  background: #0f172a;
  padding: 2px 2px;
  border-radius: 4px;
  margin-top: 4px;
}

/* --- 背景オーバーレイ --- */
.slide-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 45;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}

/* --- スライドイン・ドロワーカード --- */
.slide-drawer-card {
  position: fixed;
  top: 0;
  right: -100%;
  width: 85%;
  max-width: 360px;
  height: 100%;
  background-color: #0f172a;
  border-left: 2px solid #38bdf8;
  z-index: 50;
  padding: 20px;
  box-sizing: border-box;
  box-shadow: -10px 0 25px rgba(0, 0, 0, 0.7);
  transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.slide-drawer-card.open {
  right: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #334155;
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: bold;
  color: #f8fafc;
}

.close-btn {
  background: #334155;
  border: none;
  color: #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:active {
  background: #e11d48;
  color: #fff;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
}

.input-group {
  margin-bottom: 12px;
}

.sub-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.text-input {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #ffffff;
  font-size: 16px;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* --- PC用レスポンシブ --- */
@media (min-width: 768px) {
  .side-trigger-btn-pf {
    padding: 16px 14px;
  }
  .trigger-icon {
    font-size: 14px;
  }
  .trigger-label {
    font-size: 14px;
  }
  .slide-drawer-card {
    max-width: 450px;
    padding: 32px;
  }
  .card-title {
    font-size: 18px;
  }
  .text-input {
    height: 54px;
    font-size: 18px;
  }
}
</style>