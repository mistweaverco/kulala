import * as monaco from 'monaco-editor'

// Import the workers in a production-safe way.
// This is different than in Monaco's documentation for Vite,
// but avoids a weird error ("Unexpected usage") at runtime
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

monaco.editor.setTheme('vs-dark')

self.MonacoEnvironment = {
  getWorker: function (_: string, label: string): Worker {
    switch (label) {
      case 'json':
        return new jsonWorker()
      case 'html':
      case 'xml':
        return new htmlWorker()
      default:
        return new editorWorker()
    }
  }
}

export { monaco }
