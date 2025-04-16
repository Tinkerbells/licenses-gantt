import React from 'react'

import type { ExtendedLicense } from '@/types/license.types'

import { formatPrice, getLicenseStats } from '@/utils/gantt-utils'

interface GanttHeaderProps {
  licenses: ExtendedLicense[]
}

/**
 * Компонент заголовка диаграммы Ганта с статистикой по лицензиям
 */
export const GanttHeader: React.FC<GanttHeaderProps> = ({ licenses }) => {
  const stats = getLicenseStats(licenses)

  // Функция для визуального отображения статуса
  const renderStatusCircle = (status: string, count: number) => {
    let color = '#ccc'

    switch (status) {
      case 'active':
        color = '#4CAF50'
        break
      case 'renewal':
        color = '#FF9800'
        break
      case 'expired':
        color = '#F44336'
        break
    }

    return (
      <div className="stat-item">
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: color,
            marginRight: '5px',
          }}
        />
        <div className="stat-label">
          {status}
          :
        </div>
        <div className="stat-value">
          {count}
          {' '}
          шт.
        </div>
      </div>
    )
  }

  return (
    <div className="gantt-header">
      <h1>График лицензий</h1>

      <div className="gantt-stats">
        <div className="summary-stats">
          <div className="stat-item">
            <div className="stat-label">Всего лицензий:</div>
            <div className="stat-value">
              {stats.totalLicenses}
              {' '}
              шт.
            </div>
          </div>

          {renderStatusCircle('Активные', stats.activeLicenses)}
          {renderStatusCircle('Требуют продления', stats.renewalLicenses)}
          {renderStatusCircle('Истекшие', stats.expiredLicenses)}

          <div className="stat-item">
            <div className="stat-label">Общая стоимость:</div>
            <div className="stat-value">{formatPrice(stats.totalPrice)}</div>
          </div>

          {stats.upcomingExpirations.length > 0 && (
            <div className="stat-item">
              <div className="stat-label">Ближайшее истечение:</div>
              <div className="stat-value">
                {new Date(stats.upcomingExpirations[0].date).toLocaleDateString('ru-RU')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
