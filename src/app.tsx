import React from 'react'

import './App.css'
import { LicenseGanttChart } from './view/gantt/gantt-chart'

const App: React.FC = () => {
  return (
    <div className="app">
      <main className="app-content">
        <LicenseGanttChart />
      </main>
    </div>
  )
}

export default App
