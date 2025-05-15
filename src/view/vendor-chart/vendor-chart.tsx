import React, { useMemo } from 'react'
import { Card, Empty, Spin } from '@tinkerbells/xenon-ui'
import { ChartTooltip, ChartTooltipContent, ChartTooltipItem, LineChart } from '@tinkerbells/xenon-charts'

import { useFilter } from '@/context/filter-context'
import { formatRub } from '@/shared/lib/utils/format-rub'

interface VendorChartProps {
  vendor: string
}

export const VendorChart: React.FC<VendorChartProps> = ({ vendor }) => {
  const {
    loading,
    error,
    getDetailDataForVendor,
  } = useFilter()

  // Получаем данные для конкретного вендора
  const chartData = useMemo(() => {
    if (loading || !vendor) {
      return null
    }

    return getDetailDataForVendor(vendor)
  }, [getDetailDataForVendor, vendor, loading])

  // Определяем максимальное значение для серии для настройки оси Y
  const maxValue = useMemo(() => {
    if (!chartData || !chartData.data.length) {
      return 1000
    }

    return Math.max(...chartData.data.map(point => point.y)) * 1.1 // Добавляем 10% сверху для лучшего отображения
  }, [chartData])

  // Конфигурация графика
  /* eslint-disable ts/ban-ts-comment */
  // @ts-ignore
  const chartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) {
      return {}
    }

    return {
      chart: {
        type: 'line',
        height: '200px',
      },
      title: false,
      subtitle: false,
      series: [{
        type: 'line',
        name: chartData.name,
        data: chartData.data,
        marker: {
          enabled: true,
          radius: 3,
        },
      }],
      legend: false,
      tooltip: {
        valueDecimals: 3,
        valuePrefix: '',
        valueSuffix: '',
      },
      xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%d.%m.%Y}',
        },
        crosshair: true,
      },
      yAxis: {
        title: false,
        max: maxValue,
        tickPixelInterval: 30,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        series: {
          animation: {
            duration: 300,
          },
          lineWidth: 2,
          states: {
            hover: {
              lineWidth: 3,
            },
          },
        },
      },
    }
  }, [chartData, maxValue])

  // Отображение в зависимости от состояния
  const renderContent = () => {
    if (loading) {
      return (
        <div className="chart-loading-container">
          <Spin tip="Загрузка данных..." />
        </div>
      )
    }

    if (error) {
      return (
        <Empty
          description={`Ошибка загрузки данных: ${error}`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )
    }

    if (!chartData) {
      return (
        <Empty
          description="Нет данных для отображения"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )
    }

    return (
      <LineChart
        tooltip={chart => (
          <ChartTooltip offsetY={-50} offsetX={25} chart={chart}>
            <ChartTooltipContent>
              {(ctx) => {
                return (
                  <ChartTooltipItem>
                    {ctx.series.name}
                    :
                    <b>{Math.floor(Number(ctx.y))}</b>
                    {' '}
                    т.р.
                  </ChartTooltipItem>
                )
              }}
            </ChartTooltipContent>
          </ChartTooltip>
        )}
        options={chartOptions}
      />
    )
  }

  // Статистика по выбранному вендору
  const renderStats = () => {
    if (!chartData || loading) {
      return null
    }

    // Считаем общую сумму для вендора
    const totalSum = chartData.data.reduce((sum, point) => sum + point.y, 0)

    // Находим максимальное значение и его дату
    const maxPoint = chartData.data.reduce((max, point) =>
      point.y > max.y ? point : max, { x: 0, y: 0 })

    const maxDate = maxPoint.x ? new Date(maxPoint.x).toLocaleDateString('ru-RU') : 'Н/Д'

    return (
      <div className="chart-statistics vendor-chart-statistics">
        <div className="stat-item">
          <span className="stat-label">Общая сумма:</span>
          <span className="stat-value">{formatRub(totalSum * 1000)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Максимальный платеж:</span>
          <span className="stat-value">{formatRub(maxPoint.y * 1000)}</span>
          <span className="stat-date">
            (
            {maxDate}
            )
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card
      title={`${vendor}`}
      className="vendor-chart"
      size="small"
    >
      <div className="chart-container">
        {renderContent()}
      </div>
    </Card>
  )
}
