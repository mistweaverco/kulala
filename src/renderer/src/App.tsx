import { TopBar } from './components/TopBar'
import icons from './assets/icons.svg'

function App(): JSX.Element {
  return (
    <div className="container">
      <TopBar />

      <svg className="hero-logo" viewBox="0 0 900 300">
        <use xlinkHref={`${icons}#electron`} />
      </svg>
      <h2 className="hero-text">This will be a minimal insomnia alternative, someday.</h2>
    </div>
  )
}

export default App
