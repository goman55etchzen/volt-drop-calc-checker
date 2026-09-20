<!-- src/components/Motor/ElbSelectionCard.vue -->
<template>
  <div class="category-card elb-card">
    <div class="card-category-header">
      <span class="category-badge elb-badge">漏電保護</span>
      <span class="category-title">漏電遮断器 (ELCB)・設置工事</span>
    </div>

    <div class="card-body-grid">
      <div class="result-item">
        <span class="item-label">推奨 ELCB 容量</span>
        <span class="item-value highlight-cyan">{{ elcbInfo?.recommendedAmp || '-' }} <span class="unit">A</span></span>
      </div>
      <div class="result-item">
        <span class="item-label">ELCB 感度電流</span>
        <span class="item-value highlight-cyan">{{ elcbInfo?.sensitivityCurrent || '-' }} <span class="unit">mA</span></span>
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-slate-700/60">
      <span class="item-label">対応設置工事</span>
      <div class="mt-1 bg-slate-900/80 p-2.5 rounded-lg border border-slate-700 text-xs text-slate-200 leading-relaxed">
        {{ recommendedInstallation }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  elcbInfo: { recommendedAmp: number; sensitivityCurrent: number } | null;
  recommendedInstallation: string;
}>();
</script>

<style scoped>
.category-card {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.elb-card {
  border-left: 4px solid #38bdf8;
}
.card-category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 8px;
}
.category-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.elb-badge { background-color: #0369a1; color: #bae6fd; }
.category-title {
  font-size: 13px;
  font-weight: bold;
  color: #f8fafc;
}
.card-body-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.result-item {
  background-color: #1e293b;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.item-label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
}
.item-value {
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
}
.highlight-cyan { color: #38bdf8; }
.unit { font-size: 12px; font-weight: normal; color: #94a3b8; }
</style>