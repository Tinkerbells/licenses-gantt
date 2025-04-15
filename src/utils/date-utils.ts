import * as d3 from 'd3'

import { DateGranularity } from '@/types/license.types'

/**
 * Определение гранулярности дат на основе диапазона дат
 * @param startDate - начальная дата диапазона
 * @param endDate - конечная дата диапазона
 * @returns тип гранулярности для отображения
 */
export function determineDateGranularity(startDate: Date, endDate: Date): DateGranularity {
  const diffInMilliseconds = endDate.getTime() - startDate.getTime()
  const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24)

  if (diffInDays > 730) { // > 2 года
    return DateGranularity.YEAR
  }
  else if (diffInDays > 180) { // > 6 месяцев
    return DateGranularity.QUARTER
  }
  else if (diffInDays > 60) { // > 2 месяца
    return DateGranularity.MONTH
  }
  else if (diffInDays > 14) { // > 2 недели
    return DateGranularity.WEEK
  }
  else {
    return DateGranularity.DAY
  }
}

/**
 * Получение форматтера дат на основе гранулярности
 * @param granularity - тип гранулярности
 * @returns форматтер D3 для дат
 */
export function getDateFormatter(granularity: DateGranularity): (date: Date) => string {
  switch (granularity) {
    case DateGranularity.YEAR:
      return d3.timeFormat('%Y')
    case DateGranularity.QUARTER:
      return (date: Date) => {
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `${d3.timeFormat('%Y')(date)} Q${quarter}`
      }
    case DateGranularity.MONTH:
      return d3.timeFormat('%B %Y')
    case DateGranularity.WEEK:
      return d3.timeFormat('W%W %Y')
    case DateGranularity.DAY:
      return d3.timeFormat('%d %b')
    default:
      return d3.timeFormat('%d.%m.%Y')
  }
}

/**
 * Получение интервала тиков для оси дат на основе гранулярности
 * @param granularity - тип гранулярности
 * @returns D3 функция интервала для тиков
 */
export function getTickInterval(granularity: DateGranularity) {
  switch (granularity) {
    case DateGranularity.YEAR:
      return d3.timeYear.every(1)
    case DateGranularity.QUARTER:
      return d3.timeMonth.every(3)
    case DateGranularity.MONTH:
      return d3.timeMonth.every(1)
    case DateGranularity.WEEK:
      return d3.timeWeek.every(1)
    case DateGranularity.DAY:
      return d3.timeDay.every(1)
    default:
      return d3.timeMonth.every(1)
  }
}

/**
 * Получение русского названия месяца
 * @param month - номер месяца (0-11)
 * @returns название месяца на русском языке
 */
export function getRussianMonth(month: number): string {
  const months = [
    'январь',
    'февраль',
    'март',
    'апрель',
    'май',
    'июнь',
    'июль',
    'август',
    'сентябрь',
    'октябрь',
    'ноябрь',
    'декабрь',
  ]
  return months[month]
}

/**
 * Локализованный форматтер дат для русского языка
 * @param granularity - тип гранулярности
 * @returns форматтер для дат на русском языке
 */
export function getRussianDateFormatter(granularity: DateGranularity): (date: Date) => string {
  switch (granularity) {
    case DateGranularity.YEAR:
      return (date: Date) => `${date.getFullYear()}`
    case DateGranularity.QUARTER:
      return (date: Date) => {
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `${date.getFullYear()} кв.${quarter}`
      }
    case DateGranularity.MONTH:
      return (date: Date) => getRussianMonth(date.getMonth())
    case DateGranularity.WEEK:
      return (date: Date) => {
        const weekNum = d3.timeFormat('%W')(date)
        return `неделя ${weekNum}`
      }
    case DateGranularity.DAY:
      return d3.timeFormat('%d %B')
    default:
      return d3.timeFormat('%d.%m.%Y')
  }
}
