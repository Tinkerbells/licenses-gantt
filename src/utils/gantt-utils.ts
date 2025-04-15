import * as d3 from 'd3'

import type {
  BrushState,
  License,
  LicenseItem,
} from '../types/license.types'

import {
  TimeScale,
} from '../types/license.types'

/**
 * Преобразует данные лицензий в формат для отображения на диаграмме
 * @param licenses Исходные данные о лицензиях
 * @returns Массив элементов для отображения на диаграмме
 */
export function processLicenseData(licenses: License[]): LicenseItem[] {
  // Группировка по компаниям для распределения по дорожкам
  const companiesMap = new Map<string, number>()

  // Назначаем каждой компании свою дорожку (lane)
  licenses.forEach((license) => {
    if (!companiesMap.has(license.company)) {
      companiesMap.set(license.company, companiesMap.size)
    }
  })

  // Создаем расширенные объекты для диаграммы
  return licenses.map((license, index) => {
    // Преобразуем строку даты в объект Date
    const endDate = new Date(license.date)

    // Для демонстрации делаем лицензию длительностью 1 год от даты окончания
    const startDate = new Date(endDate)
    startDate.setFullYear(startDate.getFullYear() - 1)

    // Определяем статус лицензии
    const now = new Date()
    let status: 'active' | 'expired' | 'pending' = 'active'

    if (endDate < now) {
      status = 'expired'
    }
    else if (endDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
      // Если до окончания меньше 30 дней
      status = 'pending'
    }

    // Вычисляем прогресс (сколько процентов времени прошло)
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsedDuration = Math.min(
      now.getTime() - startDate.getTime(),
      totalDuration,
    )
    const progress = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100))

    return {
      ...license,
      id: `license-${index}`,
      startDate,
      endDate,
      lane: companiesMap.get(license.company) || 0,
      progress,
      status,
    }
  })
}

/**
 * Определяет оптимальный масштаб времени на основе выбранного диапазона дат
 * @param startDate Начальная дата диапазона
 * @param endDate Конечная дата диапазона
 * @returns Оптимальный масштаб времени
 */
export function determineTimeScale(startDate: Date, endDate: Date): TimeScale {
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

/**
 * Генерирует отметки времени для шкалы в зависимости от масштаба
 * @param startDate Начальная дата диапазона
 * @param endDate Конечная дата диапазона
 * @param scale Масштаб времени
 * @returns Массив меток времени
 */
export function generateTimeTicksForScale(startDate: Date, endDate: Date, scale: TimeScale): Date[] {
  switch (scale) {
    case TimeScale.YEAR:
      return d3.timeYear.range(
        d3.timeYear.floor(startDate),
        d3.timeYear.ceil(endDate),
      )
    case TimeScale.QUARTER:
      return d3.timeMonth.range(
        d3.timeMonth.floor(startDate),
        d3.timeMonth.ceil(endDate),
        3,
      )
    case TimeScale.MONTH:
      return d3.timeMonth.range(
        d3.timeMonth.floor(startDate),
        d3.timeMonth.ceil(endDate),
      )
    case TimeScale.WEEK:
      return d3.timeWeek.range(
        d3.timeWeek.floor(startDate),
        d3.timeWeek.ceil(endDate),
      )
    case TimeScale.DAY:
      return d3.timeDay.range(
        d3.timeDay.floor(startDate),
        d3.timeDay.ceil(endDate),
      )
    default:
      return d3.timeMonth.range(
        d3.timeMonth.floor(startDate),
        d3.timeMonth.ceil(endDate),
      )
  }
}

/**
 * Форматирует дату в зависимости от масштаба времени
 * @param date Дата для форматирования
 * @param scale Масштаб времени
 * @returns Отформатированная строка даты
 */
export function formatDateForScale(date: Date, scale: TimeScale): string {
  const formatters = {
    [TimeScale.YEAR]: d3.timeFormat('%Y'),
    [TimeScale.QUARTER]: (d: Date) => {
      const quarter = Math.floor(d.getMonth() / 3) + 1
      return `Q${quarter} ${d.getFullYear()}`
    },
    [TimeScale.MONTH]: d3.timeFormat('%b %Y'),
    [TimeScale.WEEK]: (d: Date) => {
      const weekNumber = d3.timeWeek.count(d3.timeYear(d), d)
      return `W${weekNumber} ${d3.timeFormat('%b')(d)}`
    },
    [TimeScale.DAY]: d3.timeFormat('%d.%m'),
  }

  return formatters[scale](date)
}

/**
 * Преобразует состояние кисти в параметры диапазона дат
 * @param brushState Состояние кисти
 * @param config Конфигурация диаграммы
 * @param xScale Масштаб по оси X
 * @param yScale Масштаб по оси Y
 * @returns Объект с параметрами диапазона
 */
export function brushStateToParams(
  brushState: BrushState,
) {
  const result: { dateRange?: [Date, Date], laneRange?: [number, number] } = {}

  if (brushState.horizontal) {
    result.dateRange = brushState.horizontal
  }

  if (brushState.vertical) {
    result.laneRange = brushState.vertical
  }

  return result
}

/**
 * Получает цвет для лицензии в зависимости от её статуса
 * @param status Статус лицензии
 * @returns Строка с цветом
 */
export function getLicenseColor(status?: 'active' | 'expired' | 'pending'): string {
  switch (status) {
    case 'active':
      return '#4285F4'
    case 'expired':
      return '#EA4335'
    case 'pending':
      return '#FBBC05'
    default:
      return '#4285F4'
  }
}

/**
 * Проверяет перекрытие двух лицензий
 * @param a Первая лицензия
 * @param b Вторая лицензия
 * @returns true если лицензии перекрываются
 */
export function doLicensesOverlap(a: LicenseItem, b: LicenseItem): boolean {
  return a.startDate < b.endDate && a.endDate > b.startDate
}

/**
 * Оптимизирует размещение лицензий на диаграмме, распределяя их по дорожкам
 * @param licenses Массив лицензий
 * @returns Массив лицензий с оптимизированными дорожками
 */
export function optimizeLicenseLayout(licenses: LicenseItem[]): LicenseItem[] {
  const sortedLicenses = [...licenses].sort((a, b) =>
    a.startDate.getTime() - b.startDate.getTime(),
  )

  const lanes: LicenseItem[][] = []

  for (const license of sortedLicenses) {
    let placed = false
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i]
      const canPlaceInLane = lane.every(existingLicense =>
        !doLicensesOverlap(license, existingLicense),
      )

      if (canPlaceInLane) {
        lane.push(license)
        license.lane = i
        placed = true
        break
      }
    }

    if (!placed) {
      lanes.push([license])
      license.lane = lanes.length - 1
    }
  }

  return sortedLicenses
}
