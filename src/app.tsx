import React from 'react'

import './App.css'
import LicenseGanttChart from './view/gantt/gantt-chart'

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Отслеживание лицензий</h1>
        <div className="app-controls">
          <button className="app-button">Экспорт</button>
          <button className="app-button">Настройки</button>
        </div>
      </header>
      <main className="app-content">
        <LicenseGanttChart />
      </main>
    </div>
  )
}

export default App
