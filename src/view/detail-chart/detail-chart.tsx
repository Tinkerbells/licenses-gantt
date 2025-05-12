import './detail-chart.styles.css'

import { useMemo } from 'react'
import { Card, Empty, Spin } from '@tinkerbells/xenon-ui'
import { ChartTooltip, ChartTooltipContent, ChartTooltipItem, LineChart } from '@tinkerbells/xenon-charts'

import { useFilter } from '@/context/filter-context'
import { formatRub } from '@/shared/lib/utils/format-rub'

export function DetailChart() {
  const {
    loading,
    error,
    selectedVendor,
    getDetailData,
  } = useFilter()

  // Используем новую функцию getDetailData вместо прямой обработки данных
  const chartData = useMemo(() => {
    if (loading || !selectedVendor || selectedVendor.length === 0) {
      return []
    }

    return getDetailData()
  }, [getDetailData, selectedVendor, loading])

  // Определяем максимальное значение для всех серий для настройки оси Y
  const maxValue = useMemo(() => {
    if (!chartData.length)
      return 1000

    return Math.max(
      ...chartData.flatMap(series =>
        series.data.map(point => point.y),
      ),
    ) * 1.1 // Добавляем 10% сверху для лучшего отображения
  }, [chartData])

  // Конфигурация графика
  /* eslint-disable ts/ban-ts-comment */
  // @ts-ignore
  const chartOptions: Highcharts.Options = useMemo(() => {
    return {
      chart: {
        type: 'line',
        height: '300px',
      },
      title: false,
      subtitle: false,
      series: chartData.map(series => ({
        type: 'line',
        name: series.name,
        data: series.data,
        marker: {
          enabled: true,
          radius: 3,
        },
      })),
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
        tickPixelInterval: 40,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        series: {
          animation: {
            duration: 500,
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

    if (!chartData.length) {
      return (
        <Empty
          description="Выберите вендор для отображения данных"
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
                    &nbsp;
                    <b>{Math.floor(Number(ctx.y))}</b>
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

  // Статистика по выбранным вендорам
  const renderStats = () => {
    if (!chartData.length || loading)
      return null

    const totalSum = chartData.reduce((sum, series) =>
      sum + series.data.reduce((seriesSum, point) => seriesSum + point.y, 0), 0)

    return (
      <div className="chart-statistics">
        <div className="stat-item">
          <span className="stat-label">Выбрано вендоров:</span>
          <span className="stat-value">{chartData.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Общая сумма:</span>
          <span className="stat-value">{formatRub(totalSum * 1000)}</span>
        </div>
      </div>
    )
  }

  return (
    <Card
      title="Детализация по вендорам, т.р."
      className="detail-chart"
      size="small"
    >
      <div className="chart-container">
        {renderContent()}
      </div>
      {renderStats()}
    </Card>
  )
}
