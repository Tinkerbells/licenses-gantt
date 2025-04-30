import './aggregation-chart.styles.css'

import { useEffect, useMemo, useState } from 'react'
import { Card, Empty, Spin } from '@tinkerbells/xenon-ui'
import { ChartTooltip, ChartTooltipContent, ChartTooltipItem, LineChart } from '@tinkerbells/xenon-charts'

import { useFilter } from '@/context/filter-context'
import { formatRub } from '@/shared/lib/utils/format-rub'

export function AggregationChart() {
  const {
    loading,
    error,
    selectedCompany,
    getAggregationData,
  } = useFilter()

  // Локальное состояние для отслеживания, есть ли данные для отображения
  const [hasData, setHasData] = useState(false)

  // Получаем агрегированные данные для графика
  const aggregatedData = useMemo(() => getAggregationData(), [
    selectedCompany,
    getAggregationData,
  ])

  // Проверяем, есть ли данные для отображения
  useEffect(() => {
    setHasData(aggregatedData.dates.length > 0)
  }, [aggregatedData])

  // Формируем опции для Highcharts
  const chartOptions: Highcharts.Options = useMemo(() => {
    // Формируем точки для графика в формате Highcharts
    const points = aggregatedData.dates.map((date, index) => ({
      x: new Date(date).getTime(),
      y: aggregatedData.prices[index] / 1000, // Переводим в тысячи рублей
    }))

    return {
      chart: {
        type: 'line',
        height: `${(226 / 701) * 100}%`,
      },
      title: false,
      subtitle: false,
      series: [{
        type: 'line',
        name: selectedCompany || 'Все компании',
        data: points,
        marker: {
          enabled: true,
          radius: 4,
        },
        tooltip: {
          valueDecimals: 0,
          valuePrefix: '',
          valueSuffix: ' т.р.',
        },
        color: 'var(--xenon-color-primary)',
      }],
      xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%d.%m.%Y}',
        },
        tickPixelInterval: 80,
        crosshair: true,
      },
      yAxis: {
        title: false,
        tickPixelInterval: 40,
        labels: {
          formatter() {
            return this.value.toLocaleString('ru-RU')
          },
        },
      },
      tooltip: {
        headerFormat: '<b>{point.x:%d.%m.%Y}</b><br/>',
        pointFormat: '{series.name}: {point.y:,.0f} т.р.',
        shared: true,
      },
      credits: {
        enabled: false,
      },
      legend: {
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
  }, [aggregatedData, selectedCompany])

  // Определяем заголовок графика на основе выбранной компании
  const chartTitle = selectedCompany
    ? `Агрегация по компании "${selectedCompany}", т.р.`
    : 'Общая агрегация, т.р.'

  // Рендеринг содержимого графика в зависимости от состояния
  const renderChartContent = () => {
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

    if (!hasData) {
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
          <ChartTooltip chart={chart}>
            <ChartTooltipContent>
              {ctx => (
                <>
                  <ChartTooltipItem>
                    {ctx.series.name}
                    :
                    {' '}
                    <b>{Math.floor(Number(ctx.y))}</b>
                  </ChartTooltipItem>
                </>
              )}
            </ChartTooltipContent>
          </ChartTooltip>
        )}
        options={chartOptions}
      />
    )
  }

  // Рендерим статистику под графиком, если есть данные
  const renderStats = () => {
    if (!hasData || loading)
      return null

    // Считаем общую сумму
    const totalSum = aggregatedData.prices.reduce((sum, price) => sum + price, 0)
    // Находим максимальное значение
    const maxValue = Math.max(...aggregatedData.prices)
    const maxValueDate = aggregatedData.dates[aggregatedData.prices.indexOf(maxValue)]

    return (
      <div className="aggregation-stats">
        <div className="stat-item">
          <span className="stat-label">Общая сумма:</span>
          <span className="stat-value">{formatRub(totalSum)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Максимальный платеж:</span>
          <span className="stat-value">{formatRub(maxValue)}</span>
          <span className="stat-date">
            (
            {new Date(maxValueDate).toLocaleDateString('ru-RU')}
            )
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card title={chartTitle} className="aggregation-chart" size="small">
      <div className="chart-container">
        {renderChartContent()}
      </div>
      {renderStats()}
    </Card>
  )
}
