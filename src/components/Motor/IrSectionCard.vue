<!-- src/components/IrSectionCard.vue -->
<template>
  <div>
    <!-- 画面右端の中央に固定するスライドトリガーボタン（細長いタブ） -->
    <button 
      type="button" 
      class="side-trigger-btn"
      @click="$emit('update:isOpen', true)"
      aria-label="合算定格電流を表示"
    >
      <span class="trigger-icon">◀</span>
      <span class="trigger-label">合算電流</span>
      <span class="trigger-value-mini">{{ displayTotalLoadAmp.toFixed(1) }}A</span>
    </button>

    <!-- 背景の半透明オーバーレイ（開いている時だけ表示） -->
    <div 
      v-if="isOpen" 
      class="slide-overlay"
      @click="$emit('update:isOpen', false)"
    ></div>

    <!-- 横からスライドインする別カード（ドロワー） -->
    <div :class="['slide-drawer-card', { open: isOpen }]">
      <div class="drawer-header">
        <span class="card-title">⚡ 合算定格電流 (リアルタイム)</span>
        <button type="button" class="close-btn" @click="$emit('update:isOpen', false)">✕</button>
      </div>

      <div class="drawer-body">
        <div class="input-group">
          <label class="sub-label">合算定格電流 (Im×台数 + Ir)</label>
          <div class="text-input-readonly realtime-display large-display">
            {{ displayTotalLoadAmp.toFixed(2) }} <span class="text-base font-normal text-slate-400 ml-1">A</span>
          </div>
          <div class="text-xs text-slate-400 mt-2">
            ※ 選択中の電動機台数・出力、およびその他一般負荷の合算値です。
          </div>
        </div>

        <!-- 内訳補足情報 -->
        <div class="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700 text-xs text-slate-300 space-y-2">
          <div class="flex justify-between">
            <span>単体定格 (Im):</span>
            <span class="font-bold text-sky-400">{{ calculatedAmp }} A</span>
          </div>
          <div class="flex justify-between">
            <span>電動機台数:</span>
            <span class="font-bold text-sky-400">{{ motorCount }} 台</span>
          </div>
          <div class="flex justify-between">
            <span>その他一般負荷 (Ir):</span>
            <span class="font-bold text-sky-400">{{ otherLoadAmp.toFixed(1) }} A</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  displayTotalLoadAmp: number;
  calculatedAmp: number | string;
  motorCount: number;
  otherLoadAmp: number;
}>();

defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
}>();
</script>

<style scoped>
/* --- サイドトリガーボタン（画面右端中央） --- */
.side-trigger-btn {
  position: fixed;
  right: 0;
  top: 35%;
  transform: translateY(-50%);
  z-index: 1000;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  border: 1px solid #38bdf8;
  border-right: none;
  border-radius: 8px 0 0 8px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s ease, background-color 0.2s ease;
  touch-action: manipulation;
}

.side-trigger-btn:active {
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
  font-size: 11px;
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

.text-input-readonly {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #475569;
  background-color: #1e293b;
  color: #38bdf8;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.large-display {
  font-size: 28px !important;
  color: #4ade80 !important;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>