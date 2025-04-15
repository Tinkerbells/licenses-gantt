import * as d3 from 'd3'

import type {
  BrushState,
  GanttChartConfig,
  LicenseItem,
  TimeScale,
} from '../../types/license.types'

import {
  determineTimeScale,
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
  onLicenseClick: (license: LicenseItem) => void,
  onBrushChange?: (brushState: BrushState) => void,
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
    // .attr('transform', `translate(0, ${mainHeight + margin.top})`)

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

  // Рисуем ось Y (названия компаний)
  const yAxis = mainChart.append('g')
    .attr('class', SELECTORS.Y_AXIS)
    .attr('transform', `translate(${margin.left}, 0)`)

  // Собираем уникальные компании
  const uniqueCompanies = Array.from(new Set(licenseItems.map(item => item.company)))

  // Метки компаний
  yAxis.selectAll('.company-label')
    .data(uniqueCompanies)
    .enter()
    .append('text')
    .attr('class', 'company-label')
    .attr('x', -5)
    .attr('y', (d, i) => yScale(i + 0.5))
    .attr('text-anchor', 'end')
    .attr('alignment-baseline', 'middle')
    .text(d => d)
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
    .attr('width', d => Math.max(2, xScale(d.endDate) - xScale(d.startDate))) // Минимальная ширина 2px для видимости
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
    .text(d => `${d.title} (${d.amount} шт.)`)

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
    .attr('width', d => Math.max(2, xScaleMini(d.endDate) - xScaleMini(d.startDate)))
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

  // Задаем начальное положение кистей если оно передано
  // if (onBrushChange) {
  //   // Получаем текущий BrushState из React-компонента
  //   const currentState: BrushState = {
  //     horizontal: null,
  //     vertical: null,
  //   }
  //
  //   // Если есть выбор по горизонтали, устанавливаем его
  //   if (currentState.horizontal) {
  //     xBrushGroup.call(xBrush.move, currentState.horizontal.map(xScaleMini))
  //   }
  //
  //   // Если есть выбор по вертикали, устанавливаем его
  //   if (currentState.vertical) {
  //     yBrushGroup.call(yBrush.move, currentState.vertical.map(yScale))
  //   }
  // }

  // Добавляем область для зума и перемещения

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

      onBrushChange?.(newBrushState)

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
        .attr('width', d => Math.max(2, xScale(d.endDate) - xScale(d.startDate)))

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

      // Обновляем линию текущей даты
      if (today >= x0 && today <= x1) {
        mainChart.select(`.${SELECTORS.TODAY_LINE}`)
          .attr('x1', xScale(today))
          .attr('x2', xScale(today))
          .attr('visibility', 'visible')
      }
      else {
        mainChart.select(`.${SELECTORS.TODAY_LINE}`)
          .attr('visibility', 'hidden')
      }
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
        vertical: [Math.max(0, Math.floor(y0)), Math.min(maxLane + 1, Math.ceil(y1))],
      }

      onBrushChange?.(newBrushState)

      // Обновляем масштаб основной диаграммы
      yScale.domain([Math.max(0, Math.floor(y0)), Math.min(maxLane + 1, Math.ceil(y1))])

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

      // Обновляем метки компаний
      yAxis.selectAll('.company-label').remove()

      // Фильтруем только компании, которые видны в текущем диапазоне
      const visibleCompanies = uniqueCompanies.filter((_, i) =>
        i >= Math.floor(y0) && i < Math.ceil(y1),
      )

      yAxis.selectAll('.company-label')
        .data(visibleCompanies)
        .enter()
        .append('text')
        .attr('class', 'company-label')
        .attr('x', -5)
        .attr('y', (d, i) => yScale(Math.floor(y0) + i + 0.5))
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .text(d => d)
        .attr('fill', '#333')
        .attr('font-size', '12px')
    }
  }
}
