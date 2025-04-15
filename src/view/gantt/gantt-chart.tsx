import React, { useEffect, useRef, useState } from 'react'

import type { BrushState, FilterParams, GanttChartConfig, LicenseItem } from '@/types/license.types'

import { TimeScale } from '@/types/license.types'
import { licenseService } from '@/services/license-service'

import './gantt-chart.css'

import { determineTimeScale, optimizeLicenseLayout, processLicenseData } from '@/utils/gantt-utils'

import { renderGanttChart } from './gantt-chart-renderer'

interface GanttChartProps {
  initialStartDate?: Date
  initialEndDate?: Date
  initialClient?: string
  initialLicenseType?: string
  width?: number
  height?: number
  onLicenseSelect?: (license: LicenseItem) => void
  onExport?: () => void
}

export const GanttChart: React.FC<GanttChartProps> = ({
  initialStartDate,
  initialEndDate,
  initialClient,
  initialLicenseType,
  width = 1200,
  height = 600,
  onLicenseSelect,
}) => {
  // Refs для элементов DOM
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Состояние компонента
  const [licenseItems, setLicenseItems] = useState<LicenseItem[]>([])
  const [filterParams] = useState<FilterParams>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    client: initialClient,
    licenseType: initialLicenseType,
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [timeScale, setTimeScale] = useState<TimeScale>(TimeScale.MONTH)
  const [brushState, setBrushState] = useState<BrushState>({
    horizontal: null,
    vertical: null,
  })
  // Конфигурация диаграммы
  const config: GanttChartConfig = {
    width,
    height,
    margin: {
      top: 50,
      right: 40,
      bottom: 50,
      left: 60,
    },
    itemHeight: 30,
    itemMargin: 10,
    minZoom: 0.5,
    maxZoom: 4,
  }

  // Загрузка данных с сервера
  useEffect(() => {
  // Загрузка данных лицензий
    const loadLicenseData = async () => {
      try {
        setLoading(true)

        // Запрос данных с сервера
        const response = await licenseService.getLicenses(filterParams)

        // Преобразование данных для диаграммы
        let items = processLicenseData(response.licenses)

        // Оптимизация размещения лицензий на диаграмме
        items = optimizeLicenseLayout(items)

        setLicenseItems(items)

        // Если нет заданного диапазона дат, определим его на основе данных
        if (!brushState.horizontal && items.length > 0) {
          const minDate = new Date(Math.min(...items.map(i => i.startDate.getTime())))
          const maxDate = new Date(Math.max(...items.map(i => i.endDate.getTime())))

          // Добавим запас по 10% с каждой стороны
          const range = maxDate.getTime() - minDate.getTime()
          minDate.setTime(minDate.getTime() - range * 0.1)
          maxDate.setTime(maxDate.getTime() + range * 0.1)

          // Обновим состояние кисти
          setBrushState({
            ...brushState,
            horizontal: [minDate, maxDate],
          })

          // Определим оптимальный масштаб времени
          setTimeScale(determineTimeScale(minDate, maxDate))
        }
      }
      catch (error) {
        console.error('Ошибка загрузки данных:', error)
      }
      finally {
        setLoading(false)
      }
    }
    loadLicenseData()
  }, [filterParams])

  // Обработчик изменения кисти
  const handleBrushChange = (newBrushState: BrushState) => {
    setBrushState(newBrushState)

    // Если изменился горизонтальный диапазон, обновим масштаб времени
    if (
      newBrushState.horizontal
      && (!brushState.horizontal
        || newBrushState.horizontal[0].getTime() !== brushState.horizontal[0].getTime()
        || newBrushState.horizontal[1].getTime() !== brushState.horizontal[1].getTime()
      )
    ) {
      setTimeScale(determineTimeScale(newBrushState.horizontal[0], newBrushState.horizontal[1]))
    }
  }

  // Обработчик клика по лицензии
  const handleLicenseClick = (license: LicenseItem) => {
    if (onLicenseSelect) {
      onLicenseSelect(license)
    }
  }

  // Рендеринг диаграммы при изменении данных
  useEffect(() => {
    if (licenseItems.length > 0 && svgRef.current) {
      renderGanttChart(
        svgRef.current,
        licenseItems,
        config,
        timeScale,
        handleBrushChange,
        handleLicenseClick,
      )
    }
  }, [licenseItems, timeScale, config.width, config.height])

  return (
    <div className="gantt-chart-container">
      <div
        ref={chartContainerRef}
        className={`gantt-chart-view ${loading ? 'loading' : ''}`}
      >
        {loading && <div className="loading-indicator">Загрузка...</div>}
        <svg
          ref={svgRef}
          width={config.width}
          height={config.height}
          className="gantt-svg"
        >
          {/* D3 будет рендерить здесь */}
        </svg>
      </div>
    </div>
  )
}
