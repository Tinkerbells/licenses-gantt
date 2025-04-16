import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'

import './gantt-chart.styles.css'

import type { DateGranularity, DateGranularityType, ExtendedLicense } from '@/types/license.types'

import { LicenseService } from '@/services/license-service'
import {
  determineDateGranularity,
  formatDateByGranularity,
  generateAllTimeTicks,
  generateTimeAxisTicks,
  prepareLicenseData,
} from '@/utils/gantt-utils'

import { GanttHeader } from './gantt-header'
import { LicenseTooltip } from './license-tooltip'

interface LicenseGanttChartProps {
  width?: number
  height?: number
}

export const LicenseGanttChart: React.FC<LicenseGanttChartProps> = ({
  width = window.innerWidth,
  height = window.innerHeight,
}) => {
  // Refs для DOM-элементов
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // Состояния компонента
  const [data, setData] = useState<ExtendedLicense[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width, height })
  const [granularity, setGranularity] = useState<DateGranularityType>('month')
  const [tooltipInfo, setTooltipInfo] = useState<{
    license: ExtendedLicense | null
    position: { x: number, y: number }
    visible: boolean
  }>({
    license: null,
    position: { x: 0, y: 0 },
    visible: false,
  })

  // Конфигурация диаграммы
  const config = {
    width: dimensions.width,
    height: dimensions.height,
    margin: { top: 80, right: 30, bottom: 100, left: 100 },
    barHeight: 30,
    barPadding: 10,
    brushHeight: 40,
    vBrushWidth: 40,
  }

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await LicenseService.getLicensesData()
        const preparedData = prepareLicenseData(response)
        setData(preparedData)
      }
      catch (error) {
        console.error('Ошибка при загрузке данных:', error)
        setError('Не удалось загрузить данные лицензий. Пожалуйста, попробуйте позже.')
      }
      finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Обновление размеров при изменении окна
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Функция для обновления оси X при изменении детализации
  const updateXAxis = (axisScale: d3.ScaleTime<number, number>, granularity: DateGranularityType, innerWidth: number) => {
    // Определяем, какие тики использовать в зависимости от детализации
    let axisTicks
    const visibleRange = [axisScale.invert(0), axisScale.invert(innerWidth)]
    const visibleTicks = generateAllTimeTicks(visibleRange[0], visibleRange[1])
    switch (granularity) {
      case 'day':
        axisTicks = visibleTicks.days
        break
      case 'week':
        axisTicks = visibleTicks.weeks
        break
      case 'month':
        axisTicks = visibleTicks.months
        break
      case 'quarter':
        axisTicks = visibleTicks.quarters
        break
      case 'year':
        axisTicks = visibleTicks.years
        break
      default:
        axisTicks = visibleTicks.months
    }

    const newXAxis = d3.axisBottom(axisScale)
      .tickValues(axisTicks)
      .tickFormat((d) => {
        const date = d as Date
        return formatDateByGranularity(date, granularity, true)
      })

    return newXAxis
  }

  // Функция рендеринга диаграммы
  const renderChart = () => {
    if (!chartRef.current || !data.length)
      return

    // Очищаем предыдущую диаграмму
    d3.select(chartRef.current).selectAll('*').remove()

    // Настройка размеров и отступов
    const { width, height, margin, barHeight, brushHeight, vBrushWidth } = config
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom - 80 // Отведем место для заголовка

    // Определяем временной диапазон для данных
    const minDate = d3.min(data, d => d.startDate) || new Date(2024, 0, 1)
    const maxDate = d3.max(data, d => d.endDate) || new Date(2026, 0, 1)

    // Добавляем запас по времени
    const timeBuffer = (maxDate.getTime() - minDate.getTime()) * 0.1
    const adjustedMinDate = new Date(minDate.getTime() - timeBuffer)
    const adjustedMaxDate = new Date(maxDate.getTime() + timeBuffer)

    // Определяем уровень детализации дат
    const dateGranularity = determineDateGranularity(adjustedMinDate, adjustedMaxDate)
    setGranularity(dateGranularity)

    // Создаем базовые шкалы
    const xScale = d3.scaleTime()
      .domain([adjustedMinDate, adjustedMaxDate])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, 150]) // 0-150% для вертикальной шкалы
      .range([innerHeight, 0])

    // Создаем контейнер SVG
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'gantt-chart')

    // Создаем клип-путь для ограничения видимой области
    const clipId = `clip-${Math.random().toString(36).substring(2, 9)}`

    svg.append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)

    // Создаем основную группу с трансформацией
    const mainGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('class', 'main-group')

    // Создаем группу для масштабируемых элементов
    const zoomGroup = mainGroup.append('g')
      .attr('clip-path', `url(#${clipId})`)
      .attr('class', 'zoom-group')

    // Добавляем прозрачный прямоугольник для обработки событий мыши
    zoomGroup.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')

    // Добавляем вертикальные направляющие линии для разных временных периодов
    const allTimeTicks = generateAllTimeTicks(adjustedMinDate, adjustedMaxDate)

    // Создаем группу для вертикальных линий
    const gridLinesGroup = zoomGroup.append('g')
      .attr('class', 'vertical-grid-lines')

    // Добавляем линии для годов (самые заметные)
    gridLinesGroup.append('g')
      .attr('class', 'year-lines')
      .selectAll('line')
      .data(allTimeTicks.years)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#6c8ebf')
      .attr('stroke-width', 1.5)

    // Добавляем линии для кварталов
    gridLinesGroup.append('g')
      .attr('class', 'quarter-lines')
      .selectAll('line')
      .data(allTimeTicks.quarters)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#b3c6ff')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '5,3')

    // Добавляем линии для месяцев
    gridLinesGroup.append('g')
      .attr('class', 'month-lines')
      .selectAll('line')
      .data(allTimeTicks.months)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#d0d0d0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

    // Всегда создаем линии для недель и дней, но показываем в зависимости от детализации
    gridLinesGroup.append('g')
      .attr('class', 'week-lines')
      .selectAll('line')
      .data(allTimeTicks.weeks)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e6e6e6')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '2,2')

    // Всегда создаем линии для дней, но изначально скрываем, если не в детализации дней
    gridLinesGroup.append('g')
      .attr('class', 'day-lines')
      .style('display', 'block')
      .selectAll('line')
      .data(allTimeTicks.days)
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#f2f2f2')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '1,2')

    // Добавляем подписи месяцев/кварталов сверху
    zoomGroup.append('g')
      .attr('class', 'time-labels')
      .attr('transform', 'translate(0, -10)')
      .selectAll('text')
      .data(dateGranularity === 'quarter'
        ? allTimeTicks.quarters
        : dateGranularity === 'month'
          ? allTimeTicks.months.filter(d => d.getDate() === 1)
          : dateGranularity === 'year' ? allTimeTicks.years : allTimeTicks.months)
      .enter()
      .append('text')
      .attr('x', d => xScale(d))
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text(d => formatDateByGranularity(d, dateGranularity))

    // Используем функцию updateXAxis для создания оси X
    const xAxis = updateXAxis(xScale, dateGranularity, innerWidth)

    mainGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('.tick text')
      .attr('font-size', '10px')
      .attr('fill', '#666')

    // Создаем ось Y (процентная шкала)
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d}%`)
      .ticks(6)

    mainGroup.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('.tick text')
      .attr('font-size', '10px')
      .attr('fill', '#666')

    // Создаем группу для горизонтальных линий сетки
    const horizontalGridGroup = zoomGroup.append('g')
      .attr('class', 'horizontal-grid-lines')

    // Добавляем горизонтальные линии сетки
    horizontalGridGroup.selectAll('line')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3,3')

    // Создаем группу для лицензионных элементов с использованием React компонентов
    const licensesContainer = d3.select(chartRef.current)
      .append('div')
      .attr('class', 'licenses-container')
      .style('position', 'absolute')
      .style('left', `${margin.left}px`)
      .style('top', `${margin.top}px`)
      .style('width', `${innerWidth}px`)
      .style('height', `${innerHeight}px`)
      .style('overflow', 'hidden')
      .style('pointer-events', 'none')

    // Отрисовываем лицензии с использованием React компонентов
    const licensesSvg = licensesContainer.append('svg')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('overflow', 'visible')

    // Добавляем текущую дату в виде вертикальной линии
    const now = new Date()
    if (now >= adjustedMinDate && now <= adjustedMaxDate) {
      zoomGroup.append('line')
        .attr('class', 'current-date-line')
        .attr('x1', xScale(now))
        .attr('x2', xScale(now))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#ff6b6b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3')

      zoomGroup.append('text')
        .attr('class', 'current-date-label')
        .attr('x', xScale(now))
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#ff6b6b')
        .text('Сегодня')
    }

    // Отрисовываем лицензии с использованием компонента LicenseItem
    data.forEach((license) => {
      const licenseG = licensesSvg.append('g')
        .datum(license)
        .attr('class', 'license-container')

      // Создаем компоненты лицензий с помощью D3
      const x = xScale(license.startDate)
      const width = Math.max(50, xScale(license.endDate) - xScale(license.startDate))
      const yPos = yScale(license.position)

      // Создаем прямоугольник лицензии
      licenseG.append('rect')
        .attr('x', x)
        .attr('y', yPos - barHeight / 2)
        .attr('width', width)
        .attr('height', barHeight)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('class', `license-bar license-${license.status}`)
        .style('fill', license.status === 'active'
          ? '#e6f2ff'
          : license.status === 'expired' ? '#ffe6e6' : '#fff9e6')
        .style('stroke', license.status === 'active'
          ? '#a9d1f7'
          : license.status === 'expired' ? '#ffb3b3' : '#ffd480')
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseenter', function (event) {
          d3.select(this).style('fill-opacity', 0.8)
          setTooltipInfo({
            license,
            position: { x: event.clientX, y: event.clientY },
            visible: true,
          })
        })
        .on('mousemove', (event) => {
          setTooltipInfo(prev => ({
            ...prev,
            position: { x: event.clientX, y: event.clientY },
          }))
        })
        .on('mouseleave', function () {
          d3.select(this).style('fill-opacity', 1)
          setTooltipInfo(prev => ({ ...prev, visible: false }))
        })

      // Добавляем статус лицензии
      licenseG.append('text')
        .attr('x', x + 10)
        .attr('y', yPos - 5)
        .attr('class', 'status-label')
        .style('font-size', '10px')
        .style('fill', '#666')
        .style('pointer-events', 'none')
        .text(license.status === 'active'
          ? 'Активна'
          : license.status === 'expired' ? 'Истекла' : 'Требуется продление')

      // Добавляем название лицензии
      licenseG.append('text')
        .attr('x', x + 10)
        .attr('y', yPos + 10)
        .attr('class', 'license-name')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', '#444')
        .style('pointer-events', 'none')
        .text(license.title)

      // Добавляем количество и цену
      licenseG.append('text')
        .attr('x', x + width - 10)
        .attr('y', yPos - 5)
        .attr('text-anchor', 'end')
        .attr('class', 'amount-label')
        .style('font-size', '10px')
        .style('fill', '#0078d4')
        .style('pointer-events', 'none')
        .text(`${license.amount} шт.`)

      // Добавляем срок лицензии
      licenseG.append('text')
        .attr('x', x + width - 10)
        .attr('y', yPos + 10)
        .attr('text-anchor', 'end')
        .attr('class', 'term-label')
        .style('font-size', '10px')
        .style('fill', '#666')
        .style('pointer-events', 'none')
        .text(license.term || '')
    })

    // Определяем зум и поведение при зуме
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on('zoom', (event) => {
        if (isBrushing)
          return
        isZooming = true

        // Получаем новую трансформацию зума
        const transform = event.transform

        // Создаем новые масштабированные шкалы
        const newXScale = transform.rescaleX(xScale)
        const newYScale = transform.rescaleY(yScale)

        // Определяем новую детализацию дат на основе видимого диапазона
        const visibleDomain = [newXScale.invert(0), newXScale.invert(innerWidth)]
        const newGranularity = determineDateGranularity(visibleDomain[0], visibleDomain[1])

        // Управляем видимостью линий сетки в зависимости от масштаба
        const showDays = newGranularity === 'day'
        const showWeeks = newGranularity === 'day' || newGranularity === 'week'

        // Устанавливаем видимость линий в зависимости от детализации
        zoomGroup.selectAll('.day-lines')
          .style('display', showDays ? 'block' : 'none')

        zoomGroup.selectAll('.week-lines')
          .style('display', showWeeks ? 'block' : 'none')

        // Обновляем ось X с учетом новой детализации
        if (newGranularity !== granularity) {
          setGranularity(newGranularity)

          // Обновляем ось X
          const updatedXAxis = updateXAxis(newXScale, newGranularity, innerWidth)
          mainGroup.select('.x-axis').call(updatedXAxis as any)
        }

        // Обновляем положение элементов
        zoomGroup.selectAll('.year-lines line')
          .attr('x1', d => newXScale(d as Date))
          .attr('x2', d => newXScale(d as Date))

        zoomGroup.selectAll('.quarter-lines line')
          .attr('x1', d => newXScale(d as Date))
          .attr('x2', d => newXScale(d as Date))

        zoomGroup.selectAll('.month-lines line')
          .attr('x1', d => newXScale(d as Date))
          .attr('x2', d => newXScale(d as Date))

        zoomGroup.selectAll('.week-lines line')
          .attr('x1', d => newXScale(d as Date))
          .attr('x2', d => newXScale(d as Date))

        zoomGroup.selectAll('.day-lines line')
          .attr('x1', d => newXScale(d as Date))
          .attr('x2', d => newXScale(d as Date))

        zoomGroup.selectAll('.time-labels text')
          .attr('x', d => newXScale(d as Date))

        zoomGroup.select('.current-date-line')
          .attr('x1', d => newXScale(now))
          .attr('x2', d => newXScale(now))

        zoomGroup.select('.current-date-label')
          .attr('x', d => newXScale(now))

        // Обновляем положение лицензий
        licensesSvg.selectAll('.license-container').each(function () {
          const license = d3.select(this).datum() as ExtendedLicense
          const licenseG = d3.select(this)

          const x = newXScale(license.startDate)
          const width = Math.max(50, newXScale(license.endDate) - newXScale(license.startDate))
          const yPos = newYScale(license.position)

          licenseG.select('rect')
            .attr('x', x)
            .attr('y', yPos - barHeight / 2)
            .attr('width', width)

          licenseG.select('.status-label')
            .attr('x', x + 10)
            .attr('y', yPos - 5)

          licenseG.select('.license-name')
            .attr('x', x + 10)
            .attr('y', yPos + 10)

          licenseG.select('.amount-label')
            .attr('x', x + width - 10)
            .attr('y', yPos - 5)

          licenseG.select('.term-label')
            .attr('x', x + width - 10)
            .attr('y', yPos + 10)
        })

        // Обновляем положение brushes при завершении зума
        if (event.sourceEvent) {
          // Обновляем горизонтальный brush с новыми значениями
          const xDomain = newXScale.domain()
          const x0 = brushTimeScale(xDomain[0])
          const x1 = brushTimeScale(xDomain[1])

          if (x0 >= 0 && x1 <= innerWidth && x0 < x1) {
            horizontalBrushGroup.call(horizontalBrush.move, [x0, x1])
          }

          // Обновляем вертикальный brush с новыми значениями
          const yDomain = newYScale.domain()
          const y0 = yScale(yDomain[1]) // Обратите внимание на инверсию из-за направления оси Y
          const y1 = yScale(yDomain[0])

          if (y0 >= 0 && y1 <= innerHeight && y0 < y1) {
            verticalBrushGroup.call(verticalBrush.move, [y0, y1])
          }
        }

        isZooming = false
      })

    // Применяем зум к SVG
    svg.call(zoom as any)
      .on('dblclick.zoom', null) // Отключаем двойной клик для зума для лучшего UX

    // Создаем горизонтальный brush внизу
    const horizontalBrushSvg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', innerWidth)
      .attr('height', brushHeight)
      .attr('class', 'horizontal-brush')
      .style('position', 'absolute')
      .style('left', `${margin.left}px`)
      .style('top', `${height - brushHeight - 100}px`)

    const horizontalBrushGroup = horizontalBrushSvg.append('g')

    // Добавляем фон для горизонтального brush
    horizontalBrushGroup.append('rect')
      .attr('width', innerWidth)
      .attr('height', brushHeight)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 4)
      .attr('ry', 4)

    // Создаем временную ось для brush
    const brushTimeScale = xScale.copy()
    const brushTimeAxis = d3.axisBottom(brushTimeScale)
      .tickFormat((d) => {
        const date = d as Date
        return formatDateByGranularity(date, 'quarter', true)
      })
      .ticks(d3.timeMonth.every(3))

    horizontalBrushGroup.append('g')
      .attr('class', 'brush-time-axis')
      .attr('transform', `translate(0, ${brushHeight - 20})`)
      .call(brushTimeAxis as any)

    // Создаем маркеры кварталов
    const quarterTicks = generateTimeAxisTicks(adjustedMinDate, adjustedMaxDate, 'quarter')

    horizontalBrushGroup.selectAll('.quarter-marker')
      .data(quarterTicks)
      .enter()
      .append('line')
      .attr('class', 'quarter-marker')
      .attr('x1', d => brushTimeScale(d))
      .attr('x2', d => brushTimeScale(d))
      .attr('y1', 5)
      .attr('y2', brushHeight - 25)
      .attr('stroke', '#b3c6ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

    // Флаги для предотвращения рекурсивных вызовов между zoom и brush
    let isZooming = false
    let isBrushing = false

    // Создаем горизонтальный brush
    const horizontalBrush = d3.brushX()
      .extent([[0, 0], [innerWidth, brushHeight - 20]])
      .on('brush end', (event) => {
        if (!event.selection)
          return
        if (isZooming)
          return

        isBrushing = true

        const [x0, x1] = event.selection as [number, number]
        const newDomain = [brushTimeScale.invert(x0), brushTimeScale.invert(x1)]

        // Форматируем отображение дат
        const formatDate = d3.timeFormat('%d.%m.%Y')
        const startDateStr = formatDate(newDomain[0])
        const endDateStr = formatDate(newDomain[1])

        // Обновляем или создаем метки дат внутри brush
        const selectionRect = horizontalBrushGroup.select('.selection')
        let dateLabel = selectionRect.select('.brush-date-label')

        // Если метки еще нет, создаем ее
        if (dateLabel.empty()) {
          dateLabel = selectionRect.append('text')
            .attr('class', 'brush-date-label')
            .attr('text-anchor', 'middle')
            .attr('fill', '#333')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .attr('pointer-events', 'none')
        }

        // Позиционируем текст даты посередине brush
        const brushWidth = x1 - x0
        dateLabel
          .attr('x', brushWidth / 2)
          .attr('y', (brushHeight - 20) / 2 + 4)
          .text(`${startDateStr} — ${endDateStr}`)

        // Обновляем домен временной шкалы
        const newXScale = xScale.copy().domain(newDomain)

        // Определяем новый уровень детализации на основе видимого диапазона
        const newGranularity = determineDateGranularity(newDomain[0], newDomain[1])

        // Проверка видимости линий дней
        const showDays = newGranularity === 'day'
        const showWeeks = newGranularity === 'day' || newGranularity === 'week'

        // Устанавливаем видимость линий в зависимости от детализации
        zoomGroup.selectAll('.day-lines')
          .style('display', showDays ? 'block' : 'none')

        zoomGroup.selectAll('.week-lines')
          .style('display', showWeeks ? 'block' : 'none')

        // Обновляем ось X с учетом новой детализации
        const updatedXAxis = updateXAxis(newXScale, newGranularity, innerWidth)
        mainGroup.select('.x-axis').call(updatedXAxis as any)

        // Обновляем все остальные элементы диаграммы
        zoomGroup.selectAll('.vertical-grid-lines line')
          .each(function () {
            const line = d3.select(this)
            const date = line.datum() as Date
            line.attr('x1', newXScale(date)).attr('x2', newXScale(date))
          })

        zoomGroup.selectAll('.time-labels text')
          .each(function () {
            const text = d3.select(this)
            const date = text.datum() as Date
            text.attr('x', newXScale(date))
          })

        // Обновляем положение лицензий
        licensesSvg.selectAll('.license-container').each(function () {
          const license = d3.select(this).datum() as ExtendedLicense
          const licenseG = d3.select(this)

          const x = newXScale(license.startDate)
          const width = Math.max(50, newXScale(license.endDate) - newXScale(license.startDate))

          licenseG.select('rect')
            .attr('x', x)
            .attr('width', width)

          licenseG.select('.status-label')
            .attr('x', x + 10)

          licenseG.select('.license-name')
            .attr('x', x + 10)

          licenseG.select('.amount-label')
            .attr('x', x + width - 10)

          licenseG.select('.term-label')
            .attr('x', x + width - 10)
        })

        // Обновляем уровень детализации дат
        if (newGranularity !== granularity) {
          setGranularity(newGranularity)
        }

        // При завершении события brush обновляем зум
        if (event.type === 'end') {
          // Получаем текущую трансформацию зума
          const currentTransform = d3.zoomTransform(svg.node()!)

          // Устанавливаем зум-трансформацию для синхронизации с brush
          currentTransform.k = innerWidth / (x1 - x0)
          currentTransform.x = -x0 * currentTransform.k

          // Применяем трансформацию без вызова обработчика события (чтобы избежать циклических вызовов)
          isZooming = true
          svg.call(zoom.transform as any, currentTransform)
          isZooming = false
        }

        isBrushing = false
      })

    // Применяем горизонтальный brush и стилизуем его
    horizontalBrushGroup.call(horizontalBrush)

    // Стилизуем handles (ручки) brush
    horizontalBrushGroup.selectAll('.handle')
      .attr('fill', '#0078d4')
      .attr('stroke', '#005a9e')
      .attr('rx', 3)
      .attr('ry', 3)

    horizontalBrushGroup.selectAll('.selection')
      .attr('fill', '#cce4f7')
      .attr('stroke', '#0078d4')
      .attr('stroke-width', 1)
      .attr('rx', 3)
      .attr('ry', 3)

    // Устанавливаем начальную позицию горизонтального brush
    const initialBrushX0 = innerWidth * 0.1
    const initialBrushX1 = innerWidth * 0.6
    horizontalBrushGroup.call(horizontalBrush.move, [initialBrushX0, initialBrushX1])

    // Инициализируем метку даты в выделении brush
    const initialSelection = horizontalBrushGroup.select('.selection')
    const initialStartDate = d3.timeFormat('%d.%m.%Y')(xScale.invert(initialBrushX0))
    const initialEndDate = d3.timeFormat('%d.%m.%Y')(xScale.invert(initialBrushX1))

    initialSelection.append('text')
      .attr('class', 'brush-date-label')
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .attr('x', (initialBrushX1 - initialBrushX0) / 2)
      .attr('y', brushHeight / 2 - 5)
      .text(`${initialStartDate} — ${initialEndDate}`)

    // Создаем вертикальный brush слева
    const verticalBrushSvg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', vBrushWidth)
      .attr('height', innerHeight)
      .attr('class', 'vertical-brush')
      .style('position', 'absolute')
      .style('left', `${margin.left - vBrushWidth - 40}px`)
      .style('top', `${margin.top}px`)

    const verticalBrushGroup = verticalBrushSvg.append('g')

    // Добавляем фон для вертикального brush
    verticalBrushGroup.append('rect')
      .attr('width', vBrushWidth)
      .attr('height', innerHeight)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#ddd')
      .attr('rx', 3)
      .attr('ry', 3)

    // Создаем вертикальный brush для управления зумом
    const verticalBrush = d3.brushY()
      .extent([[0, 0], [vBrushWidth, innerHeight]])
      .on('brush end', (event) => {
        if (!event.selection)
          return
        if (isZooming)
          return

        isBrushing = true

        const [y0, y1] = event.selection as [number, number]
        const newYDomain = [
          yScale.invert(y1),
          yScale.invert(y0),
        ]

        // Применяем прямое изменение домена для более плавной работы brush
        const newYScale = yScale.copy().domain(newYDomain)

        // Обновляем все элементы, зависящие от yScale
        // Обновляем горизонтальные линии сетки
        zoomGroup.selectAll('.horizontal-grid-lines line')
          .attr('y1', d => newYScale(d as number))
          .attr('y2', d => newYScale(d as number))

        // Обновляем позиции лицензий по вертикали
        licensesSvg.selectAll('.license-container').each(function () {
          const license = d3.select(this).datum() as ExtendedLicense
          const licenseG = d3.select(this)

          const yPos = newYScale(license.position)

          licenseG.select('rect')
            .attr('y', yPos - barHeight / 2)

          licenseG.select('.status-label')
            .attr('y', yPos - 5)

          licenseG.select('.license-name')
            .attr('y', yPos + 10)

          licenseG.select('.amount-label')
            .attr('y', yPos - 5)

          licenseG.select('.term-label')
            .attr('y', yPos + 10)
        })

        // Обновляем зум-трансформацию только в конце, чтобы избежать дребезга
        if (event.type === 'end') {
          // Получаем текущую трансформацию зума
          const currentTransform = d3.zoomTransform(svg.node()!)

          // Устанавливаем зум-трансформацию для синхронизации с brush
          currentTransform.k = innerHeight / (y1 - y0)
          currentTransform.y = -y0 * currentTransform.k

          // Применяем трансформацию без вызова обработчика события
          isZooming = true
          svg.call(zoom.transform as any, currentTransform)
          isZooming = false
        }

        isBrushing = false
      })

    // Применяем вертикальный brush и стилизуем его
    verticalBrushGroup.call(verticalBrush as any)

    // Стилизуем ручки вертикального brush
    verticalBrushGroup.selectAll('.handle')
      .attr('fill', '#0078d4')
      .attr('stroke', '#005a9e')
      .attr('rx', 3)
      .attr('ry', 3)

    verticalBrushGroup.selectAll('.selection')
      .attr('fill', '#cce4f7')
      .attr('stroke', '#0078d4')
      .attr('stroke-width', 1)
      .attr('rx', 3)
      .attr('ry', 3)

    // Устанавливаем начальную позицию вертикального brush
    verticalBrushGroup.call(verticalBrush.move, [0, innerHeight * 0.6])
  }

  // Рендеринг диаграммы при изменении данных или размеров
  useEffect(() => {
    if (!data.length || !chartRef.current)
      return

    // Очищаем предыдущую диаграмму
    d3.select(chartRef.current).selectAll('*').remove()

    renderChart()
  }, [data, dimensions])

  // Рендер загрузки и ошибок
  if (loading) {
    return (
      <div className="gantt-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка данных лицензий...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gantt-error">
        <h3>Ошибка загрузки</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="license-gantt-container">
      {data.length > 0 && <GanttHeader licenses={data} />}
      <div ref={chartRef} className="license-gantt-chart"></div>
      <div id="tooltip-container" style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}>
        <LicenseTooltip
          license={tooltipInfo.license}
          position={tooltipInfo.position}
          visible={tooltipInfo.visible}
        />
      </div>
    </div>
  )
}
