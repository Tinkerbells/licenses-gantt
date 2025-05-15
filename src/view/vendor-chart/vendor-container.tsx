import './vendor-chart.styles.css'

import { useMemo } from 'react'
import { Alert, Card, Empty, Flex, ScrollArea, Typography } from '@tinkerbells/xenon-ui'

import { useFilter } from '@/context/filter-context'

import { VendorChart } from './vendor-chart'

export function VendorsContainer() {
  const {
    error,
    selectedVendor,
  } = useFilter()

  // Отображаем только первые 6 вендоров
  const displayVendors = useMemo(() => {
    if (!selectedVendor || selectedVendor.length === 0) {
      return []
    }
    return selectedVendor.slice(0, 6) // Ограничиваем максимум 6 вендоров
  }, [selectedVendor])

  // Если выбрано более 6 вендоров, показываем предупреждение
  const showTooManyVendorsWarning = useMemo(() => {
    return selectedVendor && selectedVendor.length > 6
  }, [selectedVendor])

  // Отображение в зависимости от состояния
  if (error) {
    return (
      <div className="detail-chart-container">
        <Empty
          description={`Ошибка загрузки данных: ${error}`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  if (!selectedVendor || selectedVendor.length === 0) {
    return (
      <Card className="detail-chart-empty-card">
        <Empty
          description="Выберите вендора для отображения данных"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    )
  }

  return (
    <div className="detail-chart-container">
      {showTooManyVendorsWarning && (
        <Alert
          message="Отображены только первые 6 вендоров"
          type="info"
          showIcon
          className="vendor-limit-alert"
        />
      )}
      <ScrollArea className="detail-chart-container__scrollarea">
        <Flex vertical gap="middle" className="vendor-charts-grid">
          {displayVendors.map(vendor => (
            <div key={vendor} className="vendor-chart-wrapper">
              <VendorChart vendor={vendor} />
            </div>
          ))}
        </Flex>
      </ScrollArea>
    </div>
  )
}
