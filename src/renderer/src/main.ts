import '@fortawesome/fontawesome-free/css/all.min.css'
import './app.css'
import App from './App.svelte'
import './overrides.css'

const app = new App({
  target: document.getElementById('app')
})

export default app
