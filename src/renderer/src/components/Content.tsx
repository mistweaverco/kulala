import icons from './../assets/icons.svg'
export function Content(): JSX.Element {
  return (
    <div className="content">
      <svg className="hero-logo" viewBox="0 0 900 300">
        <use xlinkHref={`${icons}#electron`} />
      </svg>
      <h2 className="hero-text">This will be a minimal insomnia alternative, someday.</h2>
    </div>
  )
}
