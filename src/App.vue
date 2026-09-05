<template>
  <Home />
</template>

<script setup lang="ts">
import Home from './components/Home.vue'
</script>

<style>
/* アプリ全体の基本スタイル（目に優しいダークトーン） */
body {
  margin: 0;
  padding: 0;
  background-color: #1e293b; /* 落ち着いたダークスレート */
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* アプリ全域の入力フォームの文字色・背景色を統一指定 */
input, select {
  background-color: #334155 !important; /* ソフトなダークグレー */
  color: #f8fafc !important; /* 明るいソフトホワイト */
  border: 1px solid #475569 !important;
}

input:focus, select:focus {
  border-color: #38bdf8 !important; /* やわらかいアクアブルーのアクセント */
  outline: none;
}
</style>