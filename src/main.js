import { createApp, h } from 'vue'
import App from './App.vue'

createApp({
    // render: () => h('div', 'hello, mvite!')
    render: () => h(App)
}).mount('#app')
