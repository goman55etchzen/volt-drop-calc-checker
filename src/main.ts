import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
app.mount('#app')

// 本番環境（PROD）でのみ Service Worker を登録して StackBlitz のエラーを防止
if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}