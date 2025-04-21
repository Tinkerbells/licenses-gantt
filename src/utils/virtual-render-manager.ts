/**
 * Файл: virtual-render-manager.ts
 * Путь: src/utils/virtual-render-manager.ts
 *
 * Описание: Класс для управления виртуализацией рендеринга элементов диаграммы Ганта
 * Оптимизирует производительность за счет отображения только тех элементов, которые
 * видны в текущей области просмотра
 */

import type { ExtendedLicense } from '@/types/license.types'

export class VirtualRenderManager {
  private visibleItems: ExtendedLicense[] = []
  private allItems: ExtendedLicense[] = []
  private visibleRange: [number, number] = [0, 0] // Диапазон видимых позиций
  private containerHeight: number = 0
  private itemHeight: number = 0

  // Буфер за пределами видимой области (для плавного скролла)
  private bufferSize: number = 10

  /**
   * Создает менеджер виртуального рендеринга
   * @param items Массив всех элементов
   * @param itemHeight Высота элемента в пикселях
   * @param bufferSize Размер буфера (количество элементов за пределами видимой области)
   */
  constructor(items: ExtendedLicense[], itemHeight: number, bufferSize: number = 10) {
    this.allItems = items
    this.itemHeight = itemHeight
    this.bufferSize = bufferSize
  }

  /**
   * Обновляет диапазон видимой области и пересчитывает видимые элементы
   * @param yStart Начало видимой области (в пикселях)
   * @param yEnd Конец видимой области (в пикселях)
   * @param containerHeight Высота контейнера
   */
  public updateVisibleRange(yStart: number, yEnd: number, containerHeight: number): void {
    this.visibleRange = [yStart, yEnd]
    this.containerHeight = containerHeight
    this.updateVisibleItems()
  }

  /**
   * Обновляет список всех элементов
   * @param items Новый массив всех элементов
   */
  public updateItems(items: ExtendedLicense[]): void {
    this.allItems = items
    this.updateVisibleItems()
  }

  /**
   * Пересчитывает список видимых элементов на основе текущего диапазона видимости
   */
  private updateVisibleItems(): void {
    // Расширяем видимый диапазон на размер буфера
    const bufferHeight = this.bufferSize * this.itemHeight
    const expandedStart = Math.max(0, this.visibleRange[0] - bufferHeight)
    const expandedEnd = this.visibleRange[1] + bufferHeight

    // Фильтруем только те элементы, которые находятся в видимом диапазоне (с буфером)
    this.visibleItems = this.allItems.filter((item) => {
      const itemY = this.calculateYPosition(item.position)
      return itemY >= expandedStart && itemY <= expandedEnd
    })
  }

  /**
   * Преобразует позицию в процентах в координату Y в пикселях
   * @param position Позиция элемента (в процентах от 0 до 100)
   * @returns Координата Y в пикселях
   */
  private calculateYPosition(position: number): number {
    // В D3 ось Y направлена сверху вниз, а наша позиция - снизу вверх,
    // поэтому инвертируем значение
    return this.containerHeight * (1 - position / 100)
  }

  /**
   * Возвращает текущие видимые элементы
   * @returns Массив видимых элементов
   */
  public getVisibleItems(): ExtendedLicense[] {
    return this.visibleItems
  }

  /**
   * Возвращает количество отфильтрованных (невидимых) элементов
   * @returns Количество скрытых элементов
   */
  public getFilteredCount(): number {
    return this.allItems.length - this.visibleItems.length
  }

  /**
   * Проверяет, находится ли элемент в видимой области
   * @param license Лицензия для проверки
   * @returns true, если элемент видим
   */
  public isVisible(license: ExtendedLicense): boolean {
    const itemY = this.calculateYPosition(license.position)
    const bufferHeight = this.bufferSize * this.itemHeight
    const expandedStart = Math.max(0, this.visibleRange[0] - bufferHeight)
    const expandedEnd = this.visibleRange[1] + bufferHeight

    return itemY >= expandedStart && itemY <= expandedEnd
  }
}
