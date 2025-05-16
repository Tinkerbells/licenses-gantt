import type { Options } from 'highcharts'

import { useEffect, useMemo, useState } from 'react'
import { LineChart } from '@tinkerbells/xenon-charts'
import { Card, Empty, Spin } from '@tinkerbells/xenon-ui'

import { useFilter } from '@/context/filter-context'

export function SelectedCompanyChart() {
  const {
    loading,
    error,
    selectedCompany,
    getAggregationData,
  } = useFilter()

  // Локальное состояние для отслеживания, есть ли данные для отображения
  const [hasData, setHasData] = useState(false)

  // Получаем агрегированные данные для графика по выбранной компании
  const aggregatedData = useMemo(() => getAggregationData(), [
    selectedCompany,
    getAggregationData,
  ])

  // Проверяем, есть ли данные для отображения
  useEffect(() => {
    setHasData(aggregatedData.dates.length > 0)
  }, [aggregatedData])

  // Формируем опции для Highcharts - ВАЖНО: это должно быть здесь, до любых условных return
  const chartOptions: Options = useMemo(() => {
    // Если нет компании или данных - возвращаем пустые опции
    if (!selectedCompany || !aggregatedData.dates.length) {
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
      y: aggregatedData.prices[index],
    }))

    // Определяем оптимальное количество меток на оси X
    // Используем разные интервалы в зависимости от количества точек данных
    const dateCount = points.length
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
      },
      title: {
        text: undefined,
      },
      subtitle: {
        text: undefined,
      },
      series: [{
        type: 'line',
        name: selectedCompany,
        data: points,
        colorIndex: 1,
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
          pointFormat: '<span style="color:{point.color}"></span> {series.name}: <b>{point.y}</b> т.р.<br/>',
        },
        color: 'var(--xenon-color-success)',
      }],
      xAxis: {
        type: 'datetime',
        labels: {
          format: dateFormat,
          // Добавляем поворот меток для предотвращения наложения
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
  }, [aggregatedData, selectedCompany])

  // Если компания не выбрана, показываем соответствующее сообщение
  if (!selectedCompany) {
    return (
      <Card title="Детализация по компании" className="aggregation-chart" size="small">
        <Empty
          description="Выберите компанию для отображения детальных данных"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    )
  }

  // Рендеринг содержимого графика в зависимости от состояния
  const renderChartContent = () => {
    if (loading) {
      return (
        <div className="chart-loading-container">
          <Spin />
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
          description="Нет данных для отображения по выбранной компании"
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
      title={`Детализация по компании "${selectedCompany}"`}
      className="aggregation-chart"
      size="small"
    >
      <div className="chart-container">
        {renderChartContent()}
      </div>
    </Card>
  )
}
