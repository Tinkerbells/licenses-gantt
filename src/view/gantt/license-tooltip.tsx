import React from 'react'

import type { ExtendedLicense } from '@/types/license.types'

import { formatPrice } from '@/utils/gantt-utils'

interface LicenseTooltipProps {
  license: ExtendedLicense | null
  position: { x: number, y: number }
  visible: boolean
}

/**
 * Компонент тултипа с детальной информацией о лицензии
 */
export const LicenseTooltip: React.FC<LicenseTooltipProps> = ({
  license,
  position,
  visible,
}) => {
  if (!license || !visible)
    return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU')
  }

  return (
    <div
      className="license-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        maxWidth: '300px',
        pointerEvents: 'none',
        display: visible ? 'block' : 'none',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>{license.title}</h3>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
        <strong>Компания:</strong>
        {' '}
        {license.company}
      </p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
        <strong>Дата окончания:</strong>
        {' '}
        {formatDate(license.date)}
      </p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
        <strong>Количество:</strong>
        {' '}
        {license.amount}
        {' '}
        шт.
      </p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
        <strong>Статус:</strong>
        {' '}
        <span style={{
          color: license.status === 'active'
            ? '#4CAF50'
            : license.status === 'expired' ? '#F44336' : '#FF9800',
          fontWeight: 'bold',
        }}
        >
          {license.status === 'active'
            ? 'Активна'
            : license.status === 'expired'
              ? 'Истекла'
              : 'Требуется продление'}
        </span>
      </p>
      {license.vendor && (
        <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
          <strong>Вендор:</strong>
          {' '}
          {license.vendor}
        </p>
      )}
      {license.term && (
        <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
          <strong>Срок лицензии:</strong>
          {' '}
          {license.term}
        </p>
      )}
      {license.productName && (
        <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
          <strong>Название продукта:</strong>
          {' '}
          {license.productName}
        </p>
      )}
      {license.unitPrice !== undefined && (
        <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
          <strong>Цена за единицу:</strong>
          {' '}
          {formatPrice(license.unitPrice)}
        </p>
      )}
      {license.totalPrice !== undefined && (
        <p style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
          <strong>Общая стоимость:</strong>
          {' '}
          {formatPrice(license.totalPrice)}
        </p>
      )}
    </div>
  )
}
