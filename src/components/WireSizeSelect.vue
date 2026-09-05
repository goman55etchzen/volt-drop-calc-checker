<template>
  <div class="field-group">
    <label class="label">4. 使用する電線サイズ</label>
    <div class="size-display-card" @click="emit('open')">
      <span class="size-label">選択中:</span>
      <span class="size-value">{{ selectedWireName }}</span>
      <span class="change-btn">（変更する）</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  selectedWireName: string
  isOpen: boolean
}>()

const emit = defineEmits(['open', 'close'])
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
</style>