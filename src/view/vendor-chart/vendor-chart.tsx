import React, { useMemo } from 'react'
import { LineChart } from '@tinkerbells/xenon-charts'
import { Card, Empty, Flex, Spin } from '@tinkerbells/xenon-ui'

import { useFilter } from '@/context/filter-context'

interface VendorChartProps {
  vendor: string
  colorIndex: number
}

export const VendorChart: React.FC<VendorChartProps> = ({ vendor, colorIndex }) => {
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

  // Вычисляем адаптивные настройки тиков для оси X, основываясь на количестве точек данных
  const xAxisTickConfig = useMemo(() => {
    if (!chartData || !chartData.data.length) {
      return {
        tickInterval: 365 * 24 * 3600 * 1000, // 1 год в миллисекундах по умолчанию
        dateFormat: '{value:%Y}', // Формат год
      }
    }

    // Константы для расчетов временных интервалов
    const ONE_DAY = 24 * 3600 * 1000
    const ONE_MONTH = 30 * ONE_DAY
    const ONE_QUARTER = 3 * ONE_MONTH
    const ONE_YEAR = 365 * ONE_DAY

    // Находим минимальную и максимальную даты в данных
    const timestamps = chartData.data.map(point => point.x)
    const minDate = Math.min(...timestamps)
    const maxDate = Math.max(...timestamps)
    const totalRange = maxDate - minDate

    // Определяем, сколько точек данных у нас есть
    const pointCount = chartData.data.length

    // Определяем приблизительную плотность точек (сколько точек на год)
    const pointsPerYear = (pointCount * ONE_YEAR) / totalRange

    // Если точек мало (менее 4 на год) или их очень мало в целом (меньше 5),
    // то можем использовать годовой интервал
    if (pointsPerYear <= 4 || pointCount < 5) {
      return {
        tickInterval: ONE_YEAR,
        dateFormat: '{value:%Y}', // Только год
      }
    }

    // Если точек умеренное количество (4-12 на год или общее количество 5-15),
    // используем квартальный интервал
    if (pointsPerYear <= 12 || pointCount < 15) {
      return {
        tickInterval: ONE_QUARTER,
        dateFormat: '{value:%q кв. %Y}', // Квартал и год (Q1 2023)
      }
    }

    // Если точек много (более 12 на год или больше 15 всего),
    // используем месячный интервал
    return {
      tickInterval: ONE_MONTH,
      dateFormat: '{value:%m.%Y}', // Месяц и год (01.2023)
    }
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
        colorIndex, // Индекс цвета для styled mode
        marker: {
          enabled: true,
          radius: 3,
        },
      }],
      legend: false,
      tooltip: {
        valueDecimals: 0,
        valuePrefix: '',
        valueSuffix: ' т.р.',
        xDateFormat: '%e-%m-%Y', // Формат даты в tooltip
        useHTML: true,
        headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
        pointFormat: '<span style="color:{point.color}"></span> {series.name}: <b>{point.y}</b>',
      },
      xAxis: {
        type: 'datetime',
        labels: {
          format: xAxisTickConfig.dateFormat,
          align: 'right',
          style: {
            fontSize: '10px',
            textOverflow: 'none',
          },
        },
        tickInterval: xAxisTickConfig.tickInterval,
        crosshair: true,
      },
      yAxis: {
        title: false,
        max: maxValue,
        tickPixelInterval: 70,
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
  }, [chartData, maxValue, colorIndex, xAxisTickConfig])

  // Отображение в зависимости от состояния
  const renderContent = () => {
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

    if (!chartData || chartData.data.length === 0) {
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
    <Card
      title={`${vendor}`}
      className={`vendor-chart vendor-chart-color-${colorIndex}`}
      size="small"
    >
      <div className="chart-container">
        {renderContent()}
      </div>
    </Card>
  )
}
