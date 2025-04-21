/**
 * Файл: hybrid-renderer.ts
 * Путь: src/utils/hybrid-renderer.ts
 *
 * Описание: Класс для гибридного рендеринга, переключающийся между SVG и Canvas
 * в зависимости от уровня масштабирования
 */

import * as d3 from 'd3'

import type { DateGranularityType, ExtendedLicense } from '@/types/license.types'

import { CanvasRenderer } from './canvas-renderer'

export class HybridRenderer {
  private canvasRenderer: CanvasRenderer
  private container: HTMLElement
  private svgContainer: d3.Selection<HTMLDivElement, unknown, null, undefined>
  private currentZoomScale: number = 1
  private zoomThreshold: number = 0.8 // Порог для переключения между Canvas и SVG
  private useCanvas: boolean = false

  /**
   * Создает гибридный рендерер
   * @param container Контейнер для рендеринга
   * @param width Ширина области рендеринга
   * @param height Высота области рендеринга
   */
  constructor(container: HTMLElement, width: number, height: number) {
    this.container = container

    // Создаем контейнер для SVG (используется D3)
    this.svgContainer = d3.select(container)
      .append('div')
      .attr('class', 'svg-container')
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0')
      .style('width', `${width}px`)
      .style('height', `${height}px`)

    // Создаем Canvas рендерер
    this.canvasRenderer = new CanvasRenderer(container, width, height)

    // Изначально скрываем Canvas
    this.canvasRenderer.setVisible(false)
  }

  /**
   * Изменяет размеры области рендеринга
   * @param width Новая ширина
   * @param height Новая высота
   */
  public resize(width: number, height: number): void {
    this.svgContainer
      .style('width', `${width}px`)
      .style('height', `${height}px`)

    this.canvasRenderer.resize(width, height)
  }

  /**
   * Устанавливает масштаб и переключает режим рендеринга при необходимости
   * @param scale Текущий масштаб
   */
  public setZoomScale(scale: number): void {
    this.currentZoomScale = scale
    this.canvasRenderer.setZoomLevel(scale)

    // Переключаемся между Canvas и SVG в зависимости от масштаба
    const shouldUseCanvas = scale < this.zoomThreshold

    if (shouldUseCanvas !== this.useCanvas) {
      this.useCanvas = shouldUseCanvas

      if (shouldUseCanvas) {
        // Переключаемся на Canvas
        this.svgContainer.style('display', 'none')
        this.canvasRenderer.setVisible(true)
      }
      else {
        // Переключаемся на SVG
        this.svgContainer.style('display', 'block')
        this.canvasRenderer.setVisible(false)
      }
    }
  }

  /**
   * Отрисовывает временную сетку
   * @param ticks Массив дат для тиков
   * @param xScale Шкала X
   * @param innerHeight Внутренняя высота области
   * @param granularity Текущая гранулярность
   */
  public renderGrid(
    ticks: Date[],
    xScale: d3.ScaleTime<number, number>,
    innerHeight: number,
  ): void {
    if (this.useCanvas) {
      this.canvasRenderer.clear()
      this.canvasRenderer.renderGrid(ticks, xScale, innerHeight)
    }
    // В SVG режиме сетка рисуется стандартными методами D3
  }

  /**
   * Отрисовывает горизонтальные линии сетки
   * @param ticks Массив значений для горизонтальных линий
   * @param yScale Шкала Y
   * @param innerWidth Внутренняя ширина области
   */
  public renderHorizontalGrid(
    ticks: number[],
    yScale: d3.ScaleLinear<number, number>,
    innerWidth: number,
  ): void {
    if (this.useCanvas) {
      this.canvasRenderer.renderHorizontalGrid(ticks, yScale, innerWidth)
    }
    // В SVG режиме горизонтальные линии рисуются стандартными методами D3
  }

  /**
   * Отрисовывает линию текущей даты
   * @param date Текущая дата
   * @param xScale Шкала X
   * @param innerHeight Высота области
   */
  public renderCurrentDateLine(
    date: Date,
    xScale: d3.ScaleTime<number, number>,
    innerHeight: number,
  ): void {
    if (this.useCanvas) {
      this.canvasRenderer.renderCurrentDateLine(date, xScale, innerHeight)
    }
    // В SVG режиме линия текущей даты рисуется стандартными методами D3
  }

  /**
   * Отрисовывает лицензии
   * @param licenses Массив лицензий
   * @param xScale Шкала X
   * @param yScale Шкала Y
   * @param barHeight Высота полоски
   * @param barWidth Ширина полоски
   */
  public renderLicenses(
    licenses: ExtendedLicense[],
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    barHeight: number,
    barWidth: number,
  ): void {
    if (this.useCanvas) {
      this.canvasRenderer.renderLicenses(licenses, xScale, yScale, barHeight, barWidth)
    }
    // В SVG режиме лицензии рисуются стандартными методами D3
  }

  /**
   * Возвращает контейнер SVG для использования с D3
   * @returns Контейнер SVG
   */
  public getSvgContainer(): d3.Selection<HTMLDivElement, unknown, null, undefined> {
    return this.svgContainer
  }

  /**
   * Возвращает Canvas рендерер
   * @returns Объект Canvas рендерера
   */
  public getCanvasRenderer(): CanvasRenderer {
    return this.canvasRenderer
  }

  /**
   * Проверяет, используется ли сейчас Canvas для рендеринга
   * @returns true, если используется Canvas
   */
  public isUsingCanvas(): boolean {
    return this.useCanvas
  }

  /**
   * Очищает Canvas
   */
  public clear(): void {
    if (this.useCanvas) {
      this.canvasRenderer.clear()
    }
  }

  /**
   * Уничтожает рендерер и все его ресурсы
   */
  public destroy(): void {
    this.canvasRenderer.destroy()
    this.svgContainer.remove()
  }
}
