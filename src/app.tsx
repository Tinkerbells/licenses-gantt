import React, { useEffect, useState } from 'react'

import type { LicenseItem } from './types/license.types'

import { GanttChart } from './view/gantt/gantt-chart'
import './App.css'
import { licenseService } from './services/license-service'

function App() {
  const [selectedLicense, setSelectedLicense] = useState<LicenseItem | null>(null)
  const [showWarning, setShowWarning] = useState<boolean>(false)

  // Проверяем наличие лицензий с истекающим сроком действия
  useEffect(() => {
    const checkExpiringLicenses = async () => {
      const data = await licenseService.getLicenses()
      const now = new Date()

      // Находим лицензии, до истечения которых осталось менее 30 дней
      const expiringLicenses = data.licenses.filter((license) => {
        const expiryDate = new Date(license.date)
        const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysRemaining > 0 && daysRemaining <= 30
      })

      if (expiringLicenses.length > 0) {
        setShowWarning(true)
      }
    }

    checkExpiringLicenses()
  }, [])

  const handleLicenseSelect = (license: LicenseItem) => {
    setSelectedLicense(license)
  }

  const handleExport = () => {
    // Здесь была бы реализация экспорта в Excel
    // alert('Выгрузка данных в Excel...')
  }

  const handleCloseWarning = () => {
    setShowWarning(false)
  }

  return (
    <div className="app">
      <main className="app-main">
        <GanttChart
          width={window.innerWidth - 40}
          height={window.innerHeight - 100}
          onLicenseSelect={handleLicenseSelect}
          onExport={handleExport}
        />

        {selectedLicense && (
          <div className="license-details">
            <h3>Информация о лицензии</h3>
            <div className="details-row">
              <span className="detail-label">Номер:</span>
              <span className="detail-value">{selectedLicense.title}</span>
            </div>
            <div className="details-row">
              <span className="detail-label">Компания:</span>
              <span className="detail-value">{selectedLicense.company}</span>
            </div>
            <div className="details-row">
              <span className="detail-label">Дата окончания:</span>
              <span className="detail-value">
                {new Date(selectedLicense.endDate).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div className="details-row">
              <span className="detail-label">Количество:</span>
              <span className="detail-value">
                {selectedLicense.amount}
                {' '}
                шт.
              </span>
            </div>
            <div className="details-row">
              <span className="detail-label">Статус:</span>
              <span className={`detail-value status-${selectedLicense.status}`}>
                {selectedLicense.status === 'active'
                  ? 'Активна'
                  : selectedLicense.status === 'expired' ? 'Истекла' : 'Истекает'}
              </span>
            </div>
            <button className="close-details" onClick={() => setSelectedLicense(null)}>
              ✕
            </button>
          </div>
        )}

        {showWarning && (
          <div className="warning-dialog">
            <button className="close-button" onClick={handleCloseWarning}>✕</button>
            <div className="warning-dialog-header">
              Внимание! Срок действия четырех лицензий подходит к концу.
            </div>
            <div className="warning-dialog-content">
              Срок действия лицензий на программное обеспечение истекает в ближайшее время.
            </div>
            <div className="warning-dialog-actions">
              <button className="warning-dialog-close" onClick={handleCloseWarning}>
                Закрыть
              </button>
              <button className="warning-dialog-details">
                Подробнее
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
