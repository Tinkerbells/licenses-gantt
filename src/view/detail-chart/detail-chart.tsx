import './detail-chart.styles.css'

import { useMemo } from 'react'
import { Card, Empty, Spin } from '@tinkerbells/xenon-ui'
import { ChartTooltip, ChartTooltipContent, ChartTooltipItem, LineChart } from '@tinkerbells/xenon-charts'

import { useFilter } from '@/context/filter-context'
import { formatRub } from '@/shared/lib/utils/format-rub'

export function DetailChart() {
  const {
    licensesData,
    loading,
    error,
    selectedVendor,
    dateRange,
  } = useFilter()

  // Обработка данных для графика
  const chartData = useMemo(() => {
    if (!licensesData.length || loading)
      return []

    // Если нет выбранных вендоров, возвращаем пустой массив
    if (!selectedVendor || selectedVendor.length === 0) {
      return []
    }

    // Агрегируем данные по каждому вендору (независимо от компании)
    return selectedVendor.map((vendor) => {
      // Фильтруем данные только по вендору
      const vendorData = licensesData.filter(license => license.articleCode === vendor)

      // Применяем фильтр по диапазону дат, если он установлен
      const dateFilteredData = vendorData.filter((license) => {
        const licenseDate = new Date(license.expirationDate)
        const startFilter = dateRange[0] ? licenseDate >= dateRange[0] : true
        const endFilter = dateRange[1] ? licenseDate <= dateRange[1] : true
        return startFilter && endFilter
      })

      // Группируем по датам и суммируем
      const groupedByDate: Record<string, number> = {}
      dateFilteredData.forEach((license) => {
        const date = license.expirationDate
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0
        }
        groupedByDate[date] += license.totalPrice
      })

      // Формируем массив точек для графика
      const points = Object.entries(groupedByDate)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, value]) => ({
          x: new Date(date).getTime(),
          y: value / 1000, // Преобразуем в тысячи рублей
        }))

      return {
        name: vendor,
        data: points,
      }
    }).filter(series => series.data.length > 0) // Убираем пустые серии
  }, [licensesData, selectedVendor, dateRange, loading])

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
  const chartOptions: Highcharts.Options = useMemo(() => {
    return {
      chart: {
        type: 'line',
        height: `${(226 / 701) * 100}%`,
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
        tooltip: {
          valueDecimals: 0,
          valuePrefix: '',
          valueSuffix: ' т.р.',
        },
      })),
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
      tooltip: {
        headerFormat: '<b>{point.x:%d.%m.%Y}</b><br/>',
        pointFormat: '{series.name}: {point.y:,.0f} т.р.',
        shared: true,
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
                // Вывод контекста в консоль при необходимости
                // console.log('Tooltip context:', ctx);
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
