import * as d3 from 'd3'

import type {
  BrushState,
  GanttChartConfig,
  LicenseItem,
} from '../../types/license.types'

import {
  TimeScale,
} from '../../types/license.types'
import {
  formatDateForScale,
  generateTimeTicksForScale,
  getLicenseColor,
} from '../../utils/gantt-utils'

// Уникальные идентификаторы для элементов на SVG
const SELECTORS = {
  MAIN_CHART: 'gantt-main-chart',
  MINI_CHART: 'gantt-mini-chart',
  X_BRUSH: 'gantt-x-brush',
  Y_BRUSH: 'gantt-y-brush',
  MAIN_CHART_ITEMS: 'gantt-main-items',
  MINI_CHART_ITEMS: 'gantt-mini-items',
  X_AXIS: 'gantt-x-axis',
  Y_AXIS: 'gantt-y-axis',
  GRID_LINES: 'gantt-grid-lines',
  TODAY_LINE: 'gantt-today-line',
  ZOOM_RECT: 'gantt-zoom-rect',
}

/**
 * Визуализирует диаграмму Ганта на основе переданных данных
 * @param svgElement Элемент SVG для рендеринга
 * @param licenseItems Данные о лицензиях
 * @param config Конфигурация диаграммы
 * @param timeScale Масштаб времени
 * @param onBrushChange Обработчик изменения кисти
 * @param onLicenseClick Обработчик клика по лицензии
 */
export function renderGanttChart(
  svgElement: SVGSVGElement,
  licenseItems: LicenseItem[],
  config: GanttChartConfig,
  timeScale: TimeScale,
  onBrushChange: (brushState: BrushState) => void,
  onLicenseClick: (license: LicenseItem) => void,
): void {
  // Очищаем содержимое SVG перед рендерингом
  const svg = d3.select(svgElement).html('')

  // Определяем размеры и отступы
  const { width, height, margin } = config
  const mainHeight = height - margin.top - margin.bottom - 100 // Основная область
  const miniHeight = 100 // Область мини-карты

  // Определяем диапазоны дат
  const minDate = d3.min(licenseItems, d => d.startDate) || new Date()
  const maxDate = d3.max(licenseItems, d => d.endDate) || new Date()

  // Добавляем запас по 5% с каждой стороны
  const timeRange = maxDate.getTime() - minDate.getTime()
  const extendedMinDate = new Date(minDate.getTime() - timeRange * 0.05)
  const extendedMaxDate = new Date(maxDate.getTime() + timeRange * 0.05)

  // Определяем максимальное количество дорожек
  const maxLane = d3.max(licenseItems, d => d.lane) || 0

  // Создаем масштабы для осей
  const xScale = d3.scaleTime()
    .domain([extendedMinDate, extendedMaxDate])
    .range([margin.left, width - margin.right])

  const yScale = d3.scaleLinear()
    .domain([0, maxLane + 1])
    .range([margin.top, mainHeight])

  // Масштаб для мини-карты
  const xScaleMini = d3.scaleTime()
    .domain([extendedMinDate, extendedMaxDate])
    .range([margin.left, width - margin.right])

  const yScaleMini = d3.scaleLinear()
    .domain([0, maxLane + 1])
    .range([height - margin.bottom - miniHeight, height - margin.bottom])

  // Создаем группы для элементов диаграммы
  const mainChart = svg.append('g')
    .attr('class', SELECTORS.MAIN_CHART)
    .attr('transform', `translate(0, 0)`)

  const miniChart = svg.append('g')
    .attr('class', SELECTORS.MINI_CHART)
    .attr('transform', `translate(0, ${mainHeight + margin.top})`)

  // Клиппинг для основной области диаграммы
  svg.append('defs').append('clipPath').attr('id', 'clip-main').append('rect').attr('x', margin.left).attr('y', margin.top).attr('width', width - margin.left - margin.right).attr('height', mainHeight - margin.top)

  // Рисуем сетку для основной диаграммы
  const gridLines = mainChart.append('g')
    .attr('class', SELECTORS.GRID_LINES)

  // Горизонтальные линии сетки
  gridLines.selectAll('.lane-line')
    .data(d3.range(0, maxLane + 2))
    .enter()
    .append('line')
    .attr('class', 'lane-line')
    .attr('x1', margin.left)
    .attr('y1', d => yScale(d))
    .attr('x2', width - margin.right)
    .attr('y2', d => yScale(d))
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1)

  // Вертикальные линии сетки (зависят от масштаба времени)
  const timeTicksForGrid = generateTimeTicksForScale(extendedMinDate, extendedMaxDate, timeScale)

  gridLines.selectAll('.time-line')
    .data(timeTicksForGrid)
    .enter()
    .append('line')
    .attr('class', 'time-line')
    .attr('x1', d => xScale(d))
    .attr('y1', margin.top)
    .attr('x2', d => xScale(d))
    .attr('y2', mainHeight)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1)

  // Рисуем ось времени сверху
  const xAxis = mainChart.append('g')
    .attr('class', SELECTORS.X_AXIS)
    .attr('transform', `translate(0, ${margin.top})`)

  // Основные метки времени
  xAxis.selectAll('.time-tick')
    .data(timeTicksForGrid)
    .enter()
    .append('text')
    .attr('class', 'time-tick')
    .attr('x', d => xScale(d))
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .text(d => formatDateForScale(d, timeScale))
    .attr('fill', '#333')
    .attr('font-size', '12px')

  // Рисуем ось Y (проценты)
  const yAxis = mainChart.append('g')
    .attr('class', SELECTORS.Y_AXIS)
    .attr('transform', `translate(${margin.left}, 0)`)

  // Метки процентов
  const percentages = [0, 20, 40, 60, 80, 100, 120, 140]

  yAxis.selectAll('.percent-tick')
    .data(percentages)
    .enter()
    .append('text')
    .attr('class', 'percent-tick')
    .attr('x', -5)
    .attr('y', d => margin.top + (mainHeight - margin.top) * (d / 140))
    .attr('text-anchor', 'end')
    .attr('alignment-baseline', 'middle')
    .text(d => `${d}%`)
    .attr('fill', '#333')
    .attr('font-size', '12px')

  // Линия текущей даты
  const today = new Date()

  if (today >= extendedMinDate && today <= extendedMaxDate) {
    mainChart.append('line')
      .attr('class', SELECTORS.TODAY_LINE)
      .attr('x1', xScale(today))
      .attr('y1', margin.top)
      .attr('x2', xScale(today))
      .attr('y2', mainHeight)
      .attr('stroke', '#ff5722')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')

    miniChart.append('line')
      .attr('class', 'mini-today-line')
      .attr('x1', xScaleMini(today))
      .attr('y1', height - margin.bottom - miniHeight)
      .attr('x2', xScaleMini(today))
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#ff5722')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
  }

  // Группа для элементов основной диаграммы
  const mainItems = mainChart.append('g')
    .attr('class', SELECTORS.MAIN_CHART_ITEMS)
    .attr('clip-path', 'url(#clip-main)')

  // Элементы лицензий на основной диаграмме
  const licenseBars = mainItems.selectAll('.license-item')
    .data(licenseItems)
    .enter()
    .append('g')
    .attr('class', 'license-item')
    .attr('transform', d => `translate(${xScale(d.startDate)}, ${yScale(d.lane) + 5})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => onLicenseClick(d))

  // Прямоугольники лицензий
  licenseBars.append('rect')
    .attr('width', d => Math.max(0, xScale(d.endDate) - xScale(d.startDate)))
    .attr('height', config.itemHeight)
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('fill', d => getLicenseColor(d.status))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)

  // Текст на прямоугольниках
  licenseBars.append('text')
    .attr('x', 10)
    .attr('y', config.itemHeight / 2 + 5)
    .attr('fill', '#fff')
    .attr('font-size', '12px')
    .text(d => `${d.company} (${d.amount} шт.)`)

  // Группа для элементов мини-диаграммы
  const miniItems = miniChart.append('g')
    .attr('class', SELECTORS.MINI_CHART_ITEMS)

  // Элементы лицензий на мини-диаграмме
  miniItems.selectAll('.mini-license-item')
    .data(licenseItems)
    .enter()
    .append('rect')
    .attr('class', 'mini-license-item')
    .attr('x', d => xScaleMini(d.startDate))
    .attr('y', d => yScaleMini(d.lane) + 2)
    .attr('width', d => Math.max(0, xScaleMini(d.endDate) - xScaleMini(d.startDate)))
    .attr('height', 6)
    .attr('rx', 2)
    .attr('ry', 2)
    .attr('fill', d => getLicenseColor(d.status))
    .attr('opacity', 0.7)

  // Настройка кисти по оси X (горизонтальной)
  const xBrush = d3.brushX()
    .extent([
      [margin.left, height - margin.bottom - miniHeight],
      [width - margin.right, height - margin.bottom],
    ])
    .on('brush end', brushed)

  // Настройка кисти по оси Y (вертикальной)
  const yBrush = d3.brushY()
    .extent([
      [margin.left - 20, margin.top],
      [margin.left, mainHeight],
    ])
    .on('brush end', brushedY)

  // Добавляем кисти на SVG
  const xBrushGroup = miniChart.append('g')
    .attr('class', SELECTORS.X_BRUSH)
    .call(xBrush)

  const yBrushGroup = mainChart.append('g')
    .attr('class', SELECTORS.Y_BRUSH)
    .call(yBrush)

  // Стилизуем кисти
  xBrushGroup.selectAll('.selection')
    .attr('fill', '#a8a8a8')
    .attr('fill-opacity', 0.3)
    .attr('stroke', '#6e6e6e')
    .attr('shape-rendering', 'crispEdges')

  yBrushGroup.selectAll('.selection')
    .attr('fill', '#a8a8a8')
    .attr('fill-opacity', 0.3)
    .attr('stroke', '#6e6e6e')
    .attr('shape-rendering', 'crispEdges')

  // Добавляем область для зума и перемещения
  // const zoom = d3.zoom<SVGRectElement, unknown>()
  //   .scaleExtent([config.minZoom, config.maxZoom])
  //   .on('zoom', zoomed)

  // const zoomRect = mainChart.append('rect')
  //   .attr('class', SELECTORS.ZOOM_RECT)
  //   .attr('width', width - margin.left - margin.right)
  //   .attr('height', mainHeight - margin.top)
  //   .attr('x', margin.left)
  //   .attr('y', margin.top)
  //   .attr('fill', 'none')
  //   .attr('pointer-events', 'all')
  //   .call(zoom)

  // Обработчик события зума
  // function zoomed(event: d3.D3ZoomEvent<SVGRectElement, unknown>) {
  //   // Трансформация для основной диаграммы
  //   const transform = event.transform
  //
  //   // Обновляем масштаб X
  //   const newXScale = transform.rescaleX(xScale)
  //
  //   // Перерисовываем только необходимые элементы
  //   mainItems.attr('transform', `translate(${transform.x}, 0) scale(${transform.k}, 1)`)
  //
  //   // Обновляем оси
  //   gridLines.selectAll('.time-line')
  //     .attr('x1', d => newXScale(d))
  //     .attr('x2', d => newXScale(d))
  //
  //   xAxis.selectAll('.time-tick')
  //     .attr('x', d => newXScale(d))
  //
  //   // Обновляем линию текущей даты
  //   mainChart.select(`.${SELECTORS.TODAY_LINE}`)
  //     .attr('x1', newXScale(today))
  //     .attr('x2', newXScale(today))
  // }

  // Обработчик события горизонтальной кисти
  function brushed(event: d3.D3BrushEvent<unknown>) {
    if (!event.sourceEvent)
      return // Игнорируем событие при программном вызове

    const selection = event.selection as [number, number] | null

    if (selection) {
      // Преобразуем координаты в даты
      const [x0, x1] = selection.map(xScaleMini.invert)

      // Обновляем состояние кисти
      const newBrushState: BrushState = {
        horizontal: [x0, x1],
        vertical: null, // Сохраняем вертикальную кисть без изменений
      }

      onBrushChange(newBrushState)

      // Обновляем масштаб основной диаграммы
      xScale.domain([x0, x1])

      // Обновляем временную шкалу
      const newTimeScale = determineTimeScale(x0, x1)

      if (newTimeScale !== timeScale) {
        // Здесь мы только обновляем отображение, смена масштаба
        // будет обработана при следующем рендеринге
        const newTicks = generateTimeTicksForScale(x0, x1, newTimeScale)

        xAxis.selectAll('.time-tick').remove()

        xAxis.selectAll('.time-tick')
          .data(newTicks)
          .enter()
          .append('text')
          .attr('class', 'time-tick')
          .attr('x', d => xScale(d))
          .attr('y', -10)
          .attr('text-anchor', 'middle')
          .text(d => formatDateForScale(d, newTimeScale))
          .attr('fill', '#333')
          .attr('font-size', '12px')
      }

      // Обновляем позиции элементов
      licenseBars
        .attr('transform', d => `translate(${xScale(d.startDate)}, ${yScale(d.lane) + 5})`)

      licenseBars.select('rect')
        .attr('width', d => Math.max(0, xScale(d.endDate) - xScale(d.startDate)))

      // Обновляем сетку
      gridLines.selectAll('.time-line').remove()

      const newTimeTicksForGrid = generateTimeTicksForScale(x0, x1, newTimeScale)

      gridLines.selectAll('.time-line')
        .data(newTimeTicksForGrid)
        .enter()
        .append('line')
        .attr('class', 'time-line')
        .attr('x1', d => xScale(d))
        .attr('y1', margin.top)
        .attr('x2', d => xScale(d))
        .attr('y2', mainHeight)
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1)
    }
  }

  // Обработчик события вертикальной кисти
  function brushedY(event: d3.D3BrushEvent<unknown>) {
    if (!event.sourceEvent)
      return // Игнорируем событие при программном вызове

    const selection = event.selection as [number, number] | null

    if (selection) {
      // Преобразуем координаты в индексы дорожек
      const [y0, y1] = selection.map(yScale.invert)

      // Обновляем состояние кисти
      const newBrushState: BrushState = {
        horizontal: null, // Сохраняем горизонтальную кисть без изменений
        vertical: [y0, y1],
      }

      onBrushChange(newBrushState)

      // Обновляем масштаб основной диаграммы
      yScale.domain([y0, y1])

      // Обновляем позиции элементов
      licenseBars
        .attr('transform', d => `translate(${xScale(d.startDate)}, ${yScale(d.lane) + 5})`)

      // Обновляем сетку
      gridLines.selectAll('.lane-line').remove()

      gridLines.selectAll('.lane-line')
        .data(d3.range(Math.floor(y0), Math.ceil(y1) + 1))
        .enter()
        .append('line')
        .attr('class', 'lane-line')
        .attr('x1', margin.left)
        .attr('y1', d => yScale(d))
        .attr('x2', width - margin.right)
        .attr('y2', d => yScale(d))
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1)
    }
  }

  /**
   * Определяет оптимальный масштаб времени на основе выбранного диапазона дат
   * @param startDate Начальная дата диапазона
   * @param endDate Конечная дата диапазона
   * @returns Оптимальный масштаб времени
   */
  function determineTimeScale(startDate: Date, endDate: Date): TimeScale {
    const durationMs = endDate.getTime() - startDate.getTime()
    const durationDays = durationMs / (1000 * 60 * 60 * 24)

    if (durationDays > 365) {
      return TimeScale.YEAR
    }
    else if (durationDays > 120) {
      return TimeScale.QUARTER
    }
    else if (durationDays > 30) {
      return TimeScale.MONTH
    }
    else if (durationDays > 7) {
      return TimeScale.WEEK
    }
    else {
      return TimeScale.DAY
    }
  }
}
