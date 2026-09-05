<template>
  <div class="field-group">
    <label class="label">4. 使用する電線サイズ</label>
    <button class="picker-trigger" @click="$emit('open')">
      選択中: <strong>{{ selectedWireName }}</strong> （変更する）
    </button>

    <!-- ダイアログ / モーダルモーダー -->
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <div class="modal-header">電線サイズを選択してください</div>
        <div class="size-grid">
          <button
            v-for="w in WIRE_SIZES"
            :key="w.name"
            class="size-chip"
            :class="{ active: selectedWireName === w.name }"
            @click="selectWire(w.name)"
          >
            {{ w.name }}
          </button>
        </div>
        <button class="close-btn" @click="$emit('close')">決定・閉じる</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WIRE_SIZES } from '../composables/useWireSize';

defineProps<{ selectedWireName: string; isOpen: boolean }>();
const emit = defineEmits(['update:selectedWireName', 'open', 'close']);

const selectWire = (name: string) => {
  emit('update:selectedWireName', name);
  emit('close');
};
</script>

<style scoped>
.field-group {
  margin-bottom: 16px;
}
.label {
  display: block;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 6px;
  color: #334155;
}
.picker-trigger {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}
.modal-content {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  box-sizing: border-box;
}
.modal-header {
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 15px;
}
.size-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.size-chip {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-weight: bold;
  cursor: pointer;
}
.size-chip.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.close-btn {
  width: 100%;
  padding: 12px;
  background: #0f172a;
  color: #fff;
  border-radius: 8px;
  border: none;
  font-weight: bold;
}
</style>
