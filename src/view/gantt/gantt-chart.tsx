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
  onExport,
}) => {
  // Refs для элементов DOM
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Состояние компонента
  const [licenseItems, setLicenseItems] = useState<LicenseItem[]>([])
  const [filterParams, setFilterParams] = useState<FilterParams>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    client: initialClient,
    licenseType: initialLicenseType,
  })
  const [loading, setLoading] = useState<boolean>(true)
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
    setBrushState((prevState) => {
      // Объединяем с предыдущим состоянием, чтобы не терять информацию о другой кисти
      const mergedState = {
        horizontal: newBrushState.horizontal !== null ? newBrushState.horizontal : prevState.horizontal,
        vertical: newBrushState.vertical !== null ? newBrushState.vertical : prevState.vertical,
      }

      // Если изменился горизонтальный диапазон, обновим масштаб времени
      if (
        newBrushState.horizontal
        && (!prevState.horizontal
          || newBrushState.horizontal[0].getTime() !== prevState.horizontal[0].getTime()
          || newBrushState.horizontal[1].getTime() !== prevState.horizontal[1].getTime()
        )
      ) {
        setTimeScale(determineTimeScale(newBrushState.horizontal[0], newBrushState.horizontal[1]))
      }

      return mergedState
    })
  }

  // Обработчик клика по лицензии
  const handleLicenseClick = (license: LicenseItem) => {
    if (onLicenseSelect) {
      onLicenseSelect(license)
    }
  }

  // Обработчик экспорта
  const handleExport = () => {
    if (onExport) {
      onExport()
    }
  }

  // Обработчик изменения фильтров
  const handleFilterChange = (newFilters: Partial<FilterParams>) => {
    setFilterParams(prev => ({
      ...prev,
      ...newFilters,
    }))
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
  }, [licenseItems, timeScale, brushState, config.width, config.height])

  return (
    <div className="gantt-chart-container" ref={chartContainerRef}>
      <div className="gantt-header">
        <h2 className="gantt-title">Диаграмма лицензий</h2>

        <div className="gantt-filters">
          <div className="filter-group">
            <label>Период:</label>
            <input
              type="date"
              value={filterParams.startDate?.toISOString().split('T')[0] || ''}
              onChange={e => handleFilterChange({
                startDate: e.target.value ? new Date(e.target.value) : undefined,
              })}
            />
            <span className="date-separator">—</span>
            <input
              type="date"
              value={filterParams.endDate?.toISOString().split('T')[0] || ''}
              onChange={e => handleFilterChange({
                endDate: e.target.value ? new Date(e.target.value) : undefined,
              })}
            />
          </div>

          <div className="filter-group">
            <label>Компания:</label>
            <input
              type="text"
              value={filterParams.client || ''}
              onChange={e => handleFilterChange({ client: e.target.value })}
              placeholder="Введите название компании"
            />
          </div>

          <button className="filter-reset-btn" onClick={() => setFilterParams({})}>
            Сбросить
          </button>
        </div>

        {onExport && (
          <button className="export-btn" onClick={handleExport}>
            Экспорт
          </button>
        )}
      </div>

      <div className={`gantt-chart-view ${loading ? 'loading' : ''}`}>
        {loading && <div className="loading-indicator">Загрузка...</div>}
        <svg
          ref={svgRef}
          width={config.width}
          height={config.height}
          className="gantt-svg"
        >
          {/* D3 рендеринг происходит здесь */}
        </svg>
      </div>
    </div>
  )
}
