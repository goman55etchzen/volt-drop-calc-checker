<!-- src/components/selected1.vue -->
<template>
    <div class="responsive-grid grid-3">
      <!-- 線間電圧 -->
      <div class="input-group">
        <label class="sub-label">線間電圧 (V)</label>
        <select v-model.number="voltage" class="select-input">
          <option :value="200">200 V</option>
          <option :value="220">220 V</option>
          <option :value="400">400 V</option>
          <option :value="440">440 V</option>
        </select>
      </div>
    
      <!-- 電源周波数 -->
      <div class="input-group">
        <label class="sub-label">電源周波数</label>
        <select v-model.number="frequency" class="select-input">
          <option :value="50">50 Hz (東日本)</option>
          <option :value="60">60 Hz (西日本)</option>
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
  </template>
    
  <script setup lang="ts">
  import type { EnvironmentType, PowerFrequency } from '@/types/appDefinitions';
  
  // Vue 3 の defineModel を利用した双方向バインディング
  const voltage = defineModel<number>('voltage', { required: true });
  const frequency = defineModel<PowerFrequency>('frequency', { required: true });
  const environment = defineModel<EnvironmentType>('environment', { required: true });
  </script>
    
  <style scoped>
  .responsive-grid {
    display: grid;
    gap: 10px;
    background-color: #1e293b;
    padding: 12px;
    border-radius: 8px;
  }
    
  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
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
    font-size: 16px;
    box-sizing: border-box;
  }
    
  @media (max-width: 640px) {
    .grid-3 {
      grid-template-columns: 1fr;
    }
  }
  </style>