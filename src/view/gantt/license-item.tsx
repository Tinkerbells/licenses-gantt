import type * as d3 from 'd3'

import React from 'react'

import type { ExtendedLicense } from '@/types/license.types'

import { formatPrice } from '@/utils/gantt-utils'

interface LicenseItemProps {
  license: ExtendedLicense
  xScale: d3.ScaleTime<number, number>
  yPosition: number
  barHeight: number
  onMouseEnter: (event: React.MouseEvent, license: ExtendedLicense) => void
  onMouseLeave: () => void
}

/**
 * Компонент для отображения элемента лицензии на диаграмме Ганта
 */
export const LicenseItem: React.FC<LicenseItemProps> = ({
  license,
  xScale,
  yPosition,
  barHeight,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Рассчитываем позиции и размеры
  const x = xScale(license.startDate)
  const width = Math.max(50, xScale(license.endDate) - xScale(license.startDate))

  // Получаем статус для стилизации
  const getStatusClass = () => {
    switch (license.status) {
      case 'active': return 'license-active'
      case 'expired': return 'license-expired'
      case 'renewal': return 'license-renewal'
      default: return ''
    }
  }

  // Получаем текст статуса для отображения
  const getStatusText = () => {
    switch (license.status) {
      case 'active': return 'Активна'
      case 'expired': return 'Истекла'
      case 'renewal': return 'Требуется продление'
      default: return ''
    }
  }

  return (
    <g
      className={`license ${getStatusClass()}`}
      transform={`translate(0,${yPosition})`}
      onMouseEnter={e => onMouseEnter(e, license)}
      onMouseLeave={onMouseLeave}
    >
      {/* Фон лицензии */}
      <rect
        x={x}
        y={-barHeight / 2}
        width={width}
        height={barHeight}
        rx={4}
        ry={4}
        className="license-bar"
      />

      {/* Статус лицензии */}
      <text
        x={x + 10}
        y={-barHeight / 4 + 2}
        className="status-label"
        fontSize="10px"
      >
        {getStatusText()}
      </text>

      {/* Название лицензии */}
      <text
        x={x + 10}
        y={barHeight / 4 + 2}
        className="license-name"
        fontSize="10px"
        fontWeight="bold"
      >
        {license.title}
      </text>

      {/* Информация о количестве и сроке */}
      <text
        x={x + width - 10}
        y={-barHeight / 4 + 2}
        textAnchor="end"
        className="amount-label"
        fontSize="10px"
      >
        {license.amount}
        {' '}
        шт. /
        {license.term}
      </text>

      {/* Информация о стоимости */}
      {license.totalPrice && (
        <text
          x={x + width - 10}
          y={barHeight / 4 + 2}
          textAnchor="end"
          className="price-label"
          fontSize="10px"
        >
          {formatPrice(license.totalPrice)}
        </text>
      )}
    </g>
  )
}
