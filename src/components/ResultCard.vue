<template>
  <div class="result-sticky-card" :class="{ warning: isOverCurrent }">
    <div class="sticky-inner">
      <div class="sticky-info">
        <span class="status-badge" :class="{ ok: !isOverCurrent }">
          {{ isOverCurrent ? '⚠️ 許容オーバー' : '⭕ セーフ' }}
        </span>
        <span class="sub-text">最大許容配線長</span>
      </div>
      <div class="sticky-val">
        <span class="num">{{ maxLen.toFixed(1) }}</span
        ><span class="unit">m</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ maxLen: number; isOverCurrent: boolean }>();
</script>

<style scoped>
.result-sticky-card {
  position: sticky;
  top: 12px; /* 上端から少し離して浮かせます */
  z-index: 50;
  background: #0f172a;
  color: #fff;
  padding: 14px 18px;
  border-radius: 14px; /* 四隅を丸く設定 */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  transition: background 0.3s;
  margin-bottom: 16px;
}

.result-sticky-card.warning {
  background: #7f1d1d;
}

.sticky-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sticky-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #ef4444;
  width: fit-content;
  font-weight: bold;
}

.status-badge.ok {
  background: #22c55e;
}

.sub-text {
  font-size: 12px;
  color: #94a3b8;
}

.sticky-val {
  font-size: 28px;
  font-weight: bold;
  color: #38bdf8;
  line-height: 1;
}

.unit {
  font-size: 14px;
  margin-left: 2px;
  color: #f8fafc;
}
</style>
