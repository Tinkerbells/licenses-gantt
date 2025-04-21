/**
 * Файл: canvas-renderer.ts
 * Путь: src/utils/canvas-renderer.ts
 *
 * Описание: Класс для рендеринга диаграммы Ганта с использованием Canvas вместо SVG
 * Значительно повышает производительность при большом количестве элементов
 */

import * as d3 from 'd3'

import type { DateGranularityType, ExtendedLicense } from '@/types/license.types'

import { formatRub } from '@/shared/lib/utils/format-rub'

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private dpr: number // Device Pixel Ratio для четкости на Retina-дисплеях
  private zoomLevel: number = 1

  /**
   * Создает объект рендерера Canvas
   * @param container Контейнер, в который будет добавлен Canvas
   * @param width Ширина Canvas
   * @param height Высота Canvas
   */
  constructor(container: HTMLElement, width: number, height: number) {
    this.width = width
    this.height = height
    this.dpr = window.devicePixelRatio || 1

    // Создаем Canvas элемент
    this.canvas = document.createElement('canvas')
    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'

    container.appendChild(this.canvas)

    const ctx = this.canvas.getContext('2d')
    if (!ctx)
      throw new Error('Не удалось получить контекст Canvas 2D')
    this.ctx = ctx

    // Масштабируем контекст для Retina-дисплеев
    this.ctx.scale(this.dpr, this.dpr)
  }

  /**
   * Очищает Canvas
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  /**
   * Обновляет размеры Canvas
   * @param width Новая ширина
   * @param height Новая высота
   */
  public resize(width: number, height: number): void {
    this.width = width
    this.height = height

    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`

    // Необходимо заново применить масштабирование для Retina-дисплеев
    this.ctx.scale(this.dpr, this.dpr)
  }

  /**
   * Обновляет уровень масштабирования
   * @param zoomLevel Уровень масштабирования
   */
  public setZoomLevel(zoomLevel: number): void {
    this.zoomLevel = zoomLevel
  }

  /**
   * Отрисовывает временную сетку (вертикальные линии)
   * @param ticks Массив дат для тиков сетки
   * @param xScale Шкала D3.js для оси X
   * @param yScale Шкала D3.js для оси Y
   * @param granularity Гранулярность времени
   */
  public renderGrid(
    ticks: Date[],
    xScale: d3.ScaleTime<number, number>,
    innerHeight: number,
  ): void {
    // Настройки линий для разных периодов
    const yearColor = '#6c8ebf'
    const quarterColor = '#b3c6ff'
    const monthColor = '#d0d0d0'
    const weekColor = '#e6e6e6'
    const dayColor = '#f2f2f2'

    ticks.forEach((date) => {
      const x = xScale(date)
      let color: string
      let lineWidth: number
      let dashArray: number[] | undefined

      // Определяем стиль линии в зависимости от типа периода
      const month = date.getMonth()
      const day = date.getDate()

      if (day === 1 && month === 0) {
        // Год
        color = yearColor
        lineWidth = 1.5
        dashArray = undefined
      }
      else if (day === 1 && month % 3 === 0) {
        // Квартал
        color = quarterColor
        lineWidth = 1.2
        dashArray = [5, 3]
      }
      else if (day === 1) {
        // Месяц
        color = monthColor
        lineWidth = 1
        dashArray = [3, 3]
      }
      else if (date.getDay() === 1) {
        // Неделя (понедельник)
        color = weekColor
        lineWidth = 0.8
        dashArray = [2, 2]
      }
      else {
        // День
        color = dayColor
        lineWidth = 0.5
        dashArray = [1, 2]
      }

      // Рисуем линию
      this.ctx.beginPath()
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = lineWidth

      if (dashArray) {
        this.ctx.setLineDash(dashArray)
      }
      else {
        this.ctx.setLineDash([])
      }

      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, innerHeight)
      this.ctx.stroke()
      this.ctx.setLineDash([])
    })
  }

  /**
   * Отрисовывает горизонтальные линии сетки
   * @param ticks Массив значений для горизонтальных линий
   * @param yScale Шкала D3.js для оси Y
   * @param innerWidth Ширина области отрисовки
   */
  public renderHorizontalGrid(
    ticks: number[],
    yScale: d3.ScaleLinear<number, number>,
    innerWidth: number,
  ): void {
    this.ctx.beginPath()
    this.ctx.strokeStyle = '#e0e0e0'
    this.ctx.lineWidth = 0.5
    this.ctx.setLineDash([3, 3])

    ticks.forEach((tick) => {
      const y = yScale(tick)
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(innerWidth, y)
    })

    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  /**
   * Отрисовывает линию текущей даты
   * @param date Текущая дата
   * @param xScale Шкала D3.js для оси X
   * @param innerHeight Высота области отрисовки
   */
  public renderCurrentDateLine(
    date: Date,
    xScale: d3.ScaleTime<number, number>,
    innerHeight: number,
  ): void {
    const x = xScale(date)

    // Рисуем линию текущей даты
    this.ctx.beginPath()
    this.ctx.strokeStyle = '#ff6b6b'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 3])
    this.ctx.moveTo(x, 0)
    this.ctx.lineTo(x, innerHeight)
    this.ctx.stroke()
    this.ctx.setLineDash([])

    // Добавляем метку "Сегодня"
    this.ctx.fillStyle = '#ff6b6b'
    this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Сегодня', x, -10)
    this.ctx.textAlign = 'start'
  }

  /**
   * Отрисовка всех лицензий с использованием Canvas
   * @param licenses Массив лицензий для отрисовки
   * @param xScale Шкала D3.js для оси X
   * @param yScale Шкала D3.js для оси Y
   * @param barHeight Высота полоски лицензии
   * @param barWidth Базовая ширина полоски лицензии
   */
  public renderLicenses(
    licenses: ExtendedLicense[],
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    barHeight: number,
    barWidth: number,
  ): void {
    // Применяем масштабирование ширины лицензий в зависимости от зума
    const scaledBarWidth = barWidth * Math.min(2, Math.max(0.5, this.zoomLevel))

    // Оптимизация: рисуем сначала в режиме dot (точки), если масштаб меньше порогового
    const useDotMode = this.zoomLevel < 0.9

    if (useDotMode) {
      // Режим точек при малом масштабе
      this.renderLicensesAsDots(licenses, xScale, yScale)
    }
    else {
      // Режим полных полосок при нормальном масштабе
      licenses.forEach((license) => {
        this.renderLicenseBar(license, xScale, yScale, barHeight, scaledBarWidth)
      })
    }
  }

  /**
   * Отрисовывает лицензии в виде точек (для малого масштаба)
   * @param licenses Массив лицензий
   * @param xScale Шкала X
   * @param yScale Шкала Y
   */
  private renderLicensesAsDots(
    licenses: ExtendedLicense[],
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
  ): void {
    const dotRadius = 5 * Math.min(1.5, Math.max(0.7, this.zoomLevel))

    licenses.forEach((license) => {
      const x = xScale(license.endDate)
      const y = yScale(license.position)

      // Определяем цвет в зависимости от статуса
      const color = '#aaaaaa'

      // Рисуем точку
      this.ctx.beginPath()
      this.ctx.fillStyle = color
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = 1
      this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.stroke()

      // Если масштаб достаточный, добавляем краткую дату
      if (this.zoomLevel > 0.7) {
        this.ctx.fillStyle = '#333'
        this.ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(
          d3.timeFormat('%d.%m.%Y')(license.endDate),
          x,
          y - 10,
        )
        this.ctx.textAlign = 'start'
      }
    })
  }

  /**
   * Отрисовывает полоску лицензии
   * @param license Объект лицензии
   * @param xScale Шкала X
   * @param yScale Шкала Y
   * @param barHeight Высота полоски
   * @param barWidth Ширина полоски
   */
  private renderLicenseBar(
    license: ExtendedLicense,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    barHeight: number,
    barWidth: number,
  ): void {
    const x = xScale(license.endDate)
    const y = yScale(license.position)

    // Определяем цвет в зависимости от статуса
    let fillColor: string
    const textColor: string = '#333'

    switch (license.status) {
      case 'active':
        fillColor = 'var(--xenon-color-bg-container, #ffffff)'
        break
      case 'expired':
        fillColor = '#ffe6e6'
        break
      case 'renewal':
        fillColor = '#fff9e6'
        break
      default:
        fillColor = '#f5f5f5'
    }

    // Рисуем прямоугольник лицензии
    this.ctx.fillStyle = fillColor
    this.ctx.strokeStyle = '#0078d4'
    this.ctx.lineWidth = 1

    // Скругленный прямоугольник
    this.roundRect(
      x - barWidth,
      y - barHeight / 2,
      barWidth,
      barHeight,
      4,
    )

    // Если масштаб достаточно большой, добавляем детали
    if (this.zoomLevel >= 1.2) {
      // Добавляем больше информации при высоком масштабе
      this.ctx.fillStyle = textColor
      this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'

      // Название компании и производителя
      this.ctx.fillText(license.company, x - barWidth + 10, y - 5)
      if (license.productName) {
        this.ctx.fillText(license.productName, x - barWidth + 10, y + 10)
      }

      // Цена и количество
      this.ctx.fillStyle = '#0078d4'
      this.ctx.textAlign = 'end'
      this.ctx.fillText(`${license.amount} шт.`, x - 10, y - 5)

      if (license.totalPrice) {
        this.ctx.fillText(formatRub(license.totalPrice), x - 10, y + 10)
      }
    }
    else {
      // Упрощенное отображение при среднем масштабе
      this.ctx.fillStyle = textColor
      this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      this.ctx.fillText(license.company, x - barWidth + 10, y - 5)

      this.ctx.fillStyle = '#0078d4'
      this.ctx.textAlign = 'end'
      this.ctx.fillText(`${license.amount} шт.`, x - 10, y)
    }

    // Сбрасываем выравнивание текста
    this.ctx.textAlign = 'start'
  }

  /**
   * Вспомогательный метод для рисования скругленных прямоугольников
   * @param x Координата X верхнего левого угла
   * @param y Координата Y верхнего левого угла
   * @param width Ширина прямоугольника
   * @param height Высота прямоугольника
   * @param radius Радиус скругления углов
   */
  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.stroke()
  }

  /**
   * Устанавливает видимость Canvas
   * @param visible Флаг видимости
   */
  public setVisible(visible: boolean): void {
    this.canvas.style.display = visible ? 'block' : 'none'
  }

  /**
   * Возвращает Canvas элемент
   * @returns HTML canvas элемент
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  /**
   * Уничтожает Canvas элемент
   */
  public destroy(): void {
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }
}
