import { ProjectBar, FileBar, Content } from './'

export function MainGrid(): JSX.Element {
  return (
    <div className="main-grid">
      <ProjectBar />
      <FileBar />
      <Content />
    </div>
  )
}
