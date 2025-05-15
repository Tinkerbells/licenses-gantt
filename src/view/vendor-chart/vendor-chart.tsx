import React, { useMemo } from 'react'
import { Card, Empty, Flex, Spin } from '@tinkerbells/xenon-ui'
import { ChartTooltip, ChartTooltipContent, ChartTooltipItem, LineChart } from '@tinkerbells/xenon-charts'

import { useFilter } from '@/context/filter-context'
import { formatRub } from '@/shared/lib/utils/format-rub'

interface VendorChartProps {
  vendor: string
  colorIndex: number // Индекс для определения цвета графика
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

  // Конфигурация графика
  /* eslint-disable ts/ban-ts-comment */
  // @ts-ignore
  const chartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) {
      return {}
    }

    // Определяем оптимальное количество меток на оси X
    // Используем разные интервалы в зависимости от количества точек данных
    const dateCount = chartData.data.length
    let tickInterval
    let dateFormat = '{value:%d.%m.%Y}'

    // Регулируем формат отображения дат и интервал тиков в зависимости от количества точек
    if (dateCount > 10) {
      // Для большого количества точек - показываем только день и месяц + поворачиваем метки
      dateFormat = '{value:%d.%m}'
      // Устанавливаем интервал между метками, чтобы не было наложений
      tickInterval = Math.ceil(dateCount / 6) * 24 * 3600 * 1000 // Примерно 6 меток по оси X
    }

    return {
      chart: {
        type: 'line',
        height: '200px',
        // В styled mode не указываем color здесь,
        // вместо этого используем colorIndex для применения CSS-классов
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
        valueDecimals: 3,
        valuePrefix: '',
        valueSuffix: '',
      },
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
        tickInterval,
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
  }, [chartData, maxValue, colorIndex])

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
