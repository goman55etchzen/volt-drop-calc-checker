<!-- src/components/Motor/Caution.vue -->
<template>
  <div class="caution-card-wrapper" v-if="message">
    <div class="caution-box">
      <span class="caution-icon">⚠️</span>
      <p class="caution-text">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
}>();
</script>

<style scoped>
.caution-card-wrapper {
  width: 100%;
  /* 右からニュッとスライドインするアニメーション */
  animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.caution-box {
  background-color: #451a03;
  border: 1px solid #b45309;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.caution-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.caution-text {
  font-size: 13px;
  color: #fde047;
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>