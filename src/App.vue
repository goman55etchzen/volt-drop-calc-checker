<template>
  <Home />
</template>

<script setup lang="ts">
import Home from './components/Home.vue';
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #1e293b;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

input, select {
  background-color: #334155 !important;
  color: #f8fafc !important;
  border: 1px solid #475569 !important;
}

input:focus, select:focus {
  border-color: #38bdf8 !important;
  outline: none;
}
</style>