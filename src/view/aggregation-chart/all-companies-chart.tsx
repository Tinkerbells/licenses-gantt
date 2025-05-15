import { useEffect, useMemo, useState } from 'react'
import { Card, Empty, Spin } from '@tinkerbells/xenon-ui'
import { ChartTooltip, ChartTooltipContent, ChartTooltipItem, LineChart } from '@tinkerbells/xenon-charts'

import { useFilter } from '@/context/filter-context'

export function AllCompaniesChart() {
  const {
    loading,
    error,
    getAllCompaniesAggregationData,
  } = useFilter()

  // Локальное состояние для отслеживания, есть ли данные для отображения
  const [hasData, setHasData] = useState(false)

  // Получаем агрегированные данные для графика по всем компаниям
  const aggregatedData = useMemo(() => getAllCompaniesAggregationData(), [
    getAllCompaniesAggregationData,
  ])

  // Проверяем, есть ли данные для отображения
  useEffect(() => {
    setHasData(aggregatedData.dates.length > 0)
  }, [aggregatedData])

  // Формируем опции для Highcharts
  const chartOptions = useMemo(() => {
    // Если нет данных - возвращаем пустые опции
    if (!aggregatedData.dates.length) {
      return {
        chart: {
          type: 'line',
          height: '200px',
        },
        series: [{
          type: 'line',
          name: 'Нет данных',
          data: [],
        }],
      }
    }

    // Формируем точки для графика в формате Highcharts
    const points = aggregatedData.dates.map((date, index) => ({
      x: new Date(date).getTime(),
      y: aggregatedData.prices[index], // Переводим в тысячи рублей
    }))

    return {
      chart: {
        type: 'line',
        height: '200px',
      },
      title: false,
      subtitle: false,
      series: [{
        type: 'line',
        name: 'Все компании',
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
  }, [aggregatedData])

  // Рендеринг содержимого графика в зависимости от состояния
  const renderChartContent = () => {
    if (loading) {
      return (
        <div className="chart-loading-container">
          {/* Исправляем использование Spin */}
          <Spin>
            <div style={{ padding: '20px' }}>Загрузка данных...</div>
          </Spin>
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
          <ChartTooltip offsetY={-50} offsetX={25} chart={chart}>
            <ChartTooltipContent>
              {(ctx) => {
                return (
                  <ChartTooltipItem>
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

  return (
    <Card title="Общая агрегация" className="aggregation-chart" size="small">
      <div className="chart-container">
        {renderChartContent()}
      </div>
    </Card>
  )
}
