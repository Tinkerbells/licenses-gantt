import * as d3 from 'd3'

import type { DateGranularity, ExtendedLicense, License } from '../types/license.types'

/**
 * Преобразует данные лицензий в расширенный формат для диаграммы
 * @param licenses Исходные данные лицензий
 * @returns Расширенные данные для диаграммы
 */
export function prepareLicenseData(licenses: License[]): ExtendedLicense[] {
  // Сортируем лицензии по дате
  const sortedLicenses = [...licenses].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // Формируем расширенные данные для диаграммы
  return sortedLicenses.map((license, index) => {
    const endDate = new Date(license.date)

    // Рассчитываем дату начала (3 месяца до окончания)
    const startDate = new Date(endDate)
    startDate.setMonth(startDate.getMonth() - 3)

    // Рассчитываем позицию по вертикали (20% до 120% с шагом ~3.3% на элемент)
    const position = 20 + (index * 100) / (sortedLicenses.length > 1 ? sortedLicenses.length - 1 : 1)

    // Определяем статус лицензии
    const now = new Date()
    let status: 'active' | 'expired' | 'renewal'

    if (endDate < now) {
      status = 'expired'
    }
    else if (endDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
      status = 'renewal' // Если до истечения меньше 30 дней
    }
    else {
      status = 'active'
    }

    return {
      ...license,
      id: `license-${index}`,
      startDate,
      endDate,
      position,
      status,
    }
  })
}

/**
 * Определяет детализацию дат на основе выбранного временного диапазона
 * @param startDate Начальная дата диапазона
 * @param endDate Конечная дата диапазона
 * @returns Уровень детализации дат
 */
export function determineDateGranularity(startDate: Date, endDate: Date): DateGranularity {
  const diffInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays <= 14) {
    return 'day'
  }
  else if (diffInDays <= 60) {
    return 'week'
  }
  else if (diffInDays <= 365) {
    return 'month'
  }
  else if (diffInDays <= 730) { // ~2 года
    return 'quarter'
  }
  else {
    return 'year'
  }
}

/**
 * Форматирует даты на основе выбранной детализации
 * @param date Дата для форматирования
 * @param granularity Уровень детализации
 * @param isShort Флаг для краткого формата (опционально)
 * @returns Отформатированная строка даты
 */
export function formatDateByGranularity(date: Date, granularity: DateGranularity, isShort: boolean = false): string {
  const months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
  const shortMonths = ['янв', 'фев', 'март', 'апр', 'май', 'июнь', 'июль', 'авг', 'сен', 'окт', 'ноя', 'дек']

  const monthName = isShort ? shortMonths[date.getMonth()] : months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  switch (granularity) {
    case 'day':
      return `${day} ${monthName}`
    case 'week':
      // Получаем номер недели в году
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
      return isShort ? `W${weekNumber}` : `Неделя ${weekNumber}, ${monthName}`
    case 'month':
      return isShort ? monthName : `${monthName} ${year}`
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return isShort ? `Q${quarter}` : `Q${quarter} ${year}`
    case 'year':
      return year.toString()
    default:
      return date.toLocaleDateString('ru-RU')
  }
}

/**
 * Генерирует тики для временной оси на основе детализации
 * @param startDate Начальная дата диапазона
 * @param endDate Конечная дата диапазона
 * @param granularity Уровень детализации
 * @returns Массив дат для тиков оси
 */
export function generateTimeAxisTicks(startDate: Date, endDate: Date, granularity: DateGranularity): Date[] {
  switch (granularity) {
    case 'day':
      return d3.timeDay.range(startDate, endDate)
    case 'week':
      return d3.timeWeek.range(startDate, endDate)
    case 'month':
      return d3.timeMonth.range(startDate, endDate)
    case 'quarter':
      // Для кварталов используем месяцы, но будем фильтровать только начала кварталов
      return d3.timeMonth.range(startDate, endDate)
        .filter(d => d.getMonth() % 3 === 0)
    case 'year':
      return d3.timeYear.range(startDate, endDate)
    default:
      return d3.timeMonth.range(startDate, endDate)
  }
}

/**
 * Генерирует тики для всех уровней детализации
 * @param startDate Начальная дата диапазона
 * @param endDate Конечная дата диапазона
 * @returns Объект с массивами дат для разных уровней детализации
 */
export function generateAllTimeTicks(startDate: Date, endDate: Date) {
  return {
    days: d3.timeDay.range(startDate, endDate),
    weeks: d3.timeWeek.range(startDate, endDate),
    months: d3.timeMonth.range(startDate, endDate),
    quarters: d3.timeMonth.range(startDate, endDate).filter(d => d.getMonth() % 3 === 0),
    years: d3.timeYear.range(startDate, endDate),
  }
}

/**
 * Проверяет, является ли дата первым днём периода (месяца, квартала, года и т.д.)
 * @param date Проверяемая дата
 * @param granularity Уровень детализации
 * @returns true, если дата является первым днём периода
 */
export function isFirstDayOfPeriod(date: Date, granularity: DateGranularity): boolean {
  switch (granularity) {
    case 'day':
      return true // Каждый день является первым днём для детализации по дням
    case 'week':
      return date.getDay() === 1 // Понедельник как первый день недели
    case 'month':
      return date.getDate() === 1 // Первое число месяца
    case 'quarter':
      return date.getDate() === 1 && date.getMonth() % 3 === 0
    case 'year':
      return date.getDate() === 1 && date.getMonth() === 0
    default:
      return false
  }
}

/**
 * Снимает дату до начала заданного периода (месяц, квартал, год)
 * @param date Исходная дата
 * @param granularity Уровень детализации
 * @returns Новая дата, соответствующая началу периода
 */
export function getStartOfPeriod(date: Date, granularity: DateGranularity): Date {
  const result = new Date(date)

  switch (granularity) {
    case 'day':
      result.setHours(0, 0, 0, 0)
      break
    case 'week':
      const day = result.getDay()
      const diff = result.getDate() - day + (day === 0 ? -6 : 1) // корректировка для недели, начинающейся с понедельника
      result.setDate(diff)
      result.setHours(0, 0, 0, 0)
      break
    case 'month':
      result.setDate(1)
      result.setHours(0, 0, 0, 0)
      break
    case 'quarter':
      const quarter = Math.floor(result.getMonth() / 3)
      result.setMonth(quarter * 3, 1)
      result.setHours(0, 0, 0, 0)
      break
    case 'year':
      result.setMonth(0, 1)
      result.setHours(0, 0, 0, 0)
      break
  }

  return result
}

/**
 * Получает конец периода для заданной даты
 * @param date Исходная дата
 * @param granularity Уровень детализации
 * @returns Новая дата, соответствующая концу периода
 */
export function getEndOfPeriod(date: Date, granularity: DateGranularity): Date {
  const start = getStartOfPeriod(date, granularity)
  const result = new Date(start)

  switch (granularity) {
    case 'day':
      result.setDate(result.getDate() + 1)
      break
    case 'week':
      result.setDate(result.getDate() + 7)
      break
    case 'month':
      result.setMonth(result.getMonth() + 1)
      break
    case 'quarter':
      result.setMonth(result.getMonth() + 3)
      break
    case 'year':
      result.setFullYear(result.getFullYear() + 1)
      break
  }

  result.setMilliseconds(result.getMilliseconds() - 1)
  return result
}
