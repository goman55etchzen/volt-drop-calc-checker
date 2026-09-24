<!-- src/components/cable/WireSizeSelect.vue -->
<template>
  <div class="field-group">
    <label class="label">4. 使用する電線サイズ</label>
    
    <div class="size-display-card" @click="emit('open')">
      <span class="size-label">選択中:</span>
      <span class="size-value">{{ selectedWireName }}</span>
      <span class="change-btn">（変更する）</span>
    </div>

    <!-- スマホ操作に最適化したボトムシート風モーダル -->
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">電線サイズを選択</h3>
          <button type="button" class="close-btn" @click="emit('close')">✕</button>
        </div>
        
        <div class="size-grid">
          <button
            v-for="wire in WIRE_SIZES"
            :key="wire.name"
            type="button"
            class="size-option-btn"
            :class="{ active: selectedWireName === wire.name }"
            @click="selectWire(wire.name)"
          >
            <span class="wire-name">{{ wire.name }}</span>
            <span v-if="wire.amp" class="wire-amp">許容: {{ wire.amp }}A</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WireSizeSelectProps, WireSizeSelectEmits } from '@/types/base';
import { WIRE_SIZES } from '@/types/appDefinitions';
defineProps<WireSizeSelectProps>();
const emit = defineEmits<WireSizeSelectEmits>();

const selectWire = (name: string) => {
  emit('update:selectedWireName', name);
  emit('close');
};
</script>

<style scoped>
.field-group {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #f8fafc;
}

.size-display-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  padding: 12px 16px;
  background: #334155;
  border: 1px solid #38bdf8;
  border-radius: 12px;
  cursor: pointer;
  color: #f8fafc;
  font-size: 15px;
  box-sizing: border-box;
  touch-action: manipulation;
  transition: background-color 0.2s, border-color 0.2s;
}

.size-display-card:hover {
  background-color: #475569;
  border-color: #7dd3fc;
}

.size-value {
  font-weight: bold;
  font-size: 18px;
  color: #38bdf8;
}

.change-btn {
  font-size: 13px;
  color: #94a3b8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.8);
  display: flex;
  align-items: flex-end; /* スマホ用に下部に配置（ボトムシート風） */
  justify-content: center;
  z-index: 1000;
  box-sizing: border-box;
}

.modal-content {
  background-color: #1e293b;
  border-top: 1px solid #475569;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #f8fafc;
}

.close-btn {
  background: #334155;
  border: none;
  color: #cbd5e1;
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 16px;
  overflow-y: auto;
}

.size-option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 8px 6px;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
}

.size-option-btn:hover {
  border-color: #38bdf8;
  background-color: #1e293b;
}

.size-option-btn.active {
  border-color: #38bdf8;
  background-color: #0284c7;
}

.wire-name {
  font-size: 14px;
  font-weight: bold;
  color: #f8fafc;
}

.wire-amp {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.size-option-btn.active .wire-amp {
  color: #e0f2fe;
}

/* PC向けレスポンシブ（ボトムシートを中央配置のダイアログへ変換） */
@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    padding: 20px;
  }
  .modal-content {
    border: 1px solid #475569;
    border-radius: 16px;
    max-width: 600px;
    max-height: 80vh;
    animation: fadeInModal 0.2s ease-out;
  }
  .size-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 24px;
  }
  .size-option-btn {
    min-height: 60px;
  }
  .wire-name {
    font-size: 15px;
  }
  .wire-amp {
    font-size: 12px;
  }
}

@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>