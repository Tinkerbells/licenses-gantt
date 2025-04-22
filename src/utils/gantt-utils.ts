import * as d3 from 'd3'

import type { DateGranularity, DateGranularityType, ExtendedLicense, LicensesApiData } from '../types/license.types'

import { formatRussianDate } from './locale-utils'
import { LicenseService } from '../services/license-service'

/**
 * Подготовка данных лицензий для диаграммы Ганта
 * @param apiData Данные от API @returns Массив расширенных данных лицензий
 */
export function prepareLicenseData(apiData: LicensesApiData): ExtendedLicense[] {
  return LicenseService.prepareGanttData(apiData)
}

/**
 * Определяет детализацию дат на основе выбранного временного диапазона
 * @param startDate Начальная дата диапазона
 * @param endDate Конечная дата диапазона
 * @returns Уровень детализации дат
 */
export function determineDateGranularity(startDate: Date, endDate: Date): DateGranularityType {
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
export function formatDateByGranularity(date: Date, granularity: DateGranularityType, isShort: boolean = false): string {
  return formatRussianDate(date, granularity, isShort)
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
      // Для кварталов используем месяцы, но фильтруем только начала кварталов
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
 * Группирует лицензии по компаниям для визуализации
 * @param licenses Массив лицензий
 * @returns Сгруппированные лицензии по компаниям
 */
export function groupLicensesByCompany(licenses: ExtendedLicense[]): Record<string, ExtendedLicense[]> {
  const grouped: Record<string, ExtendedLicense[]> = {}

  licenses.forEach((license) => {
    if (!grouped[license.company]) {
      grouped[license.company] = []
    }
    grouped[license.company].push(license)
  })

  return grouped
}

/**
 * Форматирует стоимость в виде строки с разделителями тысяч и валютой
 * @param price Стоимость в числовом формате
 * @returns Отформатированная строка стоимости
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Получает статистику по лицензиям
 * @param licenses Массив лицензий
 * @returns Статистика по лицензиям
 */
export function getLicenseStats(licenses: ExtendedLicense[]) {
  const now = new Date()

  // Всего лицензий
  const totalLicenses = licenses.reduce((sum, license) => sum + license.amount, 0)

  // Количество активных лицензий
  const activeLicenses = licenses
    .filter(license => license.status === 'active')
    .reduce((sum, license) => sum + license.amount, 0)

  // Количество истекающих лицензий (статус renewal)
  const renewalLicenses = licenses
    .filter(license => license.status === 'renewal')
    .reduce((sum, license) => sum + license.amount, 0)

  // Количество истекших лицензий
  const expiredLicenses = licenses
    .filter(license => license.status === 'expired')
    .reduce((sum, license) => sum + license.amount, 0)

  // Общая стоимость всех лицензий
  const totalPrice = licenses
    .reduce((sum, license) => sum + (license.totalPrice || 0), 0)

  // Ближайшие истекающие лицензии
  const upcomingExpirations = licenses
    .filter(license => new Date(license.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return {
    totalLicenses,
    activeLicenses,
    renewalLicenses,
    expiredLicenses,
    totalPrice,
    upcomingExpirations,
  }
}

export function getStrokeColor(status: ExtendedLicense['status']) {
  switch (status) {
    case 'active':
      return 'var(--xenon-color-primary)'
    case 'expired':
      return 'var(--xenon-color-error)'
    case 'renewal':
      return 'var(--xenon-color-warning)'
    default:
      return 'var(--xenon-color-primary)'
  }
}

/**
 * Создает сводную информацию по лицензиям для отображения
 * @param licenses Массив лицензий
 * @returns Текстовая сводка
 */
export function getLicenseSummary(licenses: ExtendedLicense[]): string {
  const stats = getLicenseStats(licenses)
  const nextExpiration = stats.upcomingExpirations[0]

  if (!nextExpiration) {
    return 'Нет данных о лицензиях'
  }

  const nextExpirationDate = new Date(nextExpiration.date).toLocaleDateString('ru-RU')
  const daysToExpiration = Math.ceil(
    (new Date(nextExpiration.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  return `Всего лицензий: ${stats.totalLicenses} шт. `
    + `Активных: ${stats.activeLicenses} шт. `
    + `Общая стоимость: ${formatPrice(stats.totalPrice)}. `
    + `Ближайшее истечение: ${nextExpirationDate} (${nextExpiration.company}, ${nextExpiration.amount} шт, ${daysToExpiration} дн.)`
}
