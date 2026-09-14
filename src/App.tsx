import { Cabinet } from './components/machine/Cabinet'
import { ExplainPanel } from './components/explain/ExplainPanel'
import { FirstScatterModal } from './components/modals/FirstScatterModal'

export default function App() {
  return (
    <div className="app">
      <div className="machine-col">
        <Cabinet />
      </div>
      <div className="explain-col">
        <ExplainPanel />
      </div>
      <FirstScatterModal />
    </div>
  )
}
