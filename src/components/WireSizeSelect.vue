<template>
  <div class="field-group">
    <label class="label">4. 使用する電線サイズ</label>
    
    <div class="size-display-card" @click="emit('open')">
      <span class="size-label">選択中:</span>
      <span class="size-value">{{ selectedWireName }}</span>
      <span class="change-btn">（変更する）</span>
    </div>

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
import { WIRE_SIZES, WireSizeSelectProps, WireSizeSelectEmits } from '@/types/appDefinitions';

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
  padding: 14px;
  background: #334155;
  border: 1px solid #38bdf8;
  border-radius: 10px;
  cursor: pointer;
  color: #f8fafc;
  font-size: 15px;
  line-height: 1.4;
}

.size-value {
  font-weight: bold;
  font-size: 17px;
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
  background-color: rgba(15, 23, 42, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  box-sizing: border-box;
}

.modal-content {
  background-color: #1e293b;
  border: 1px solid #475569;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #334155;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  color: #f8fafc;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
}

.size-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 16px;
  overflow-y: auto;
}

.size-option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  cursor: pointer;
}

.size-option-btn.active {
  border-color: #38bdf8;
  background-color: #0284c7;
}

.wire-name {
  font-size: 13px;
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
</style>