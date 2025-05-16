import type { Options } from 'highcharts'

import { useEffect, useMemo, useState } from 'react'
import { LineChart } from '@tinkerbells/xenon-charts'
import { Card, Empty, Flex, Spin } from '@tinkerbells/xenon-ui'

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
  const chartOptions: Options = useMemo(() => {
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

    // Определяем оптимальное количество меток на оси X
    // Используем разные интервалы в зависимости от количества точек данных
    // Упрощенный формат даты - только день и месяц
    const dateFormat = '{value:%d.%m}'

    return {
      chart: {
        type: 'line',
        height: '200px',
      },
      title: {
        text: undefined,
      },
      subtitle: {
        text: undefined,
      },
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
          xDateFormat: '%e-%m-%Y', // Формат даты в tooltip
          useHTML: true,
          headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
          pointFormat: '<span style="color:{point.color}"></span> {series.name}: <b>{point.y}</b>',
        },
        color: 'var(--xenon-color-primary)',
      }],
      xAxis: {
        type: 'datetime',
        labels: {
          format: dateFormat,
          align: 'right',
          style: {
            fontSize: '10px',
            textOverflow: 'none',
          },
        },
        // Динамический интервал между метками
        tickInterval: 5,
        crosshair: true,
      },
      yAxis: {
        title: {
          text: undefined,
        },
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
        <Flex justify="center" align="center" className="chart-loading-container">
          <Spin />
        </Flex>
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
