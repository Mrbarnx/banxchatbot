import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import router from '@/router'
import { store } from '@/store'
import ModeSelector from '@/components/ModeSelector.vue'

const app = createApp(App)

app.use(router)
app.use(store)

app.component('ModeSelector', ModeSelector)

app.mount('#app')
