import type { LicensesApiData } from '@/types/license.types'

// Интерфейс для данных временного ряда
export interface TimeSeriesData {
  date: string
  value: number
}

/**
 * Агрегирует данные лицензий по датам и компаниям
 *
 * @param data Исходные данные лицензий
 * @param companyName Название компании для фильтрации (если null, то все компании)
 * @param vendorCode Код вендора для фильтрации (если null, то все вендоры)
 * @param startDate Начальная дата диапазона (если null, то без ограничения)
 * @param endDate Конечная дата диапазона (если null, то без ограничения)
 * @returns Массив объектов с датами и значениями для графика
 */
export function aggregateLicenseDataByDate(
  data: LicensesApiData,
  companyName: string | null = null,
  vendorCode: string | null = null,
  startDate: Date | null = null,
  endDate: Date | null = null,
): TimeSeriesData[] {
  // Фильтрация по компании
  let filteredData = companyName
    ? data.filter(license => license.customer === companyName)
    : data

  // Фильтрация по вендору
  if (vendorCode) {
    filteredData = filteredData.filter(license => license.articleCode === vendorCode)
  }

  // Фильтрация по диапазону дат
  if (startDate || endDate) {
    filteredData = filteredData.filter((license) => {
      const licenseDate = new Date(license.expirationDate)

      const afterStart = startDate ? licenseDate >= startDate : true
      const beforeEnd = endDate ? licenseDate <= endDate : true

      return afterStart && beforeEnd
    })
  }

  // Группировка по датам и суммирование стоимости
  const groupedData: Record<string, number> = {}

  filteredData.forEach((license) => {
    const dateKey = license.expirationDate

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = 0
    }

    groupedData[dateKey] += license.totalPrice
  })

  // Преобразование в массив и сортировка по дате
  const result = Object.entries(groupedData)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return result
}

/**
 * Агрегирует данные лицензий по вендору и датам
 *
 * @param data Исходные данные лицензий
 * @param vendorCode Код вендора для фильтрации
 * @param companyName Название компании для фильтрации (если null, то все компании)
 * @param startDate Начальная дата диапазона (если null, то без ограничения)
 * @param endDate Конечная дата диапазона (если null, то без ограничения)
 * @returns Массив объектов с датами и значениями для графика
 */
export function aggregateLicenseDataByVendor(
  data: LicensesApiData,
  vendorCode: string,
  companyName: string | null = null,
  startDate: Date | null = null,
  endDate: Date | null = null,
): TimeSeriesData[] {
  // Фильтрация по компании
  let filteredData = companyName
    ? data.filter(license => license.customer === companyName)
    : data

  // Фильтрация по вендору
  filteredData = filteredData.filter(license => license.articleCode === vendorCode)

  // Фильтрация по диапазону дат
  if (startDate || endDate) {
    filteredData = filteredData.filter((license) => {
      const licenseDate = new Date(license.expirationDate)

      const afterStart = startDate ? licenseDate >= startDate : true
      const beforeEnd = endDate ? licenseDate <= endDate : true

      return afterStart && beforeEnd
    })
  }

  // Группировка по датам и суммирование стоимости
  const groupedData: Record<string, number> = {}

  filteredData.forEach((license) => {
    const dateKey = license.expirationDate

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = 0
    }

    groupedData[dateKey] += license.totalPrice
  })

  // Преобразование в массив и сортировка по дате
  const result = Object.entries(groupedData)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return result
}

/**
 * Форматирует даты для отображения на графике
 *
 * @param dateStr ISO строка даты
 * @param format Формат отображения ('short' | 'medium' | 'long')
 * @returns Отформатированная строка даты
 */
export function formatChartDate(dateStr: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateStr)

  switch (format) {
    case 'short':
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    case 'long':
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    case 'medium':
    default:
      return date.toLocaleDateString('ru-RU')
  }
}

/**
 * Рассчитывает статистические показатели по временному ряду
 *
 * @param data Массив данных временного ряда
 * @returns Объект со статистическими показателями
 */
export function calculateTimeSeriesStats(data: TimeSeriesData[]) {
  if (!data.length) {
    return {
      total: 0,
      average: 0,
      max: 0,
      min: 0,
      maxDate: '',
      minDate: '',
    }
  }

  const values = data.map(item => item.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = total / values.length

  const max = Math.max(...values)
  const min = Math.min(...values)

  const maxItem = data.find(item => item.value === max)
  const minItem = data.find(item => item.value === min)

  return {
    total,
    average,
    max,
    min,
    maxDate: maxItem?.date || '',
    minDate: minItem?.date || '',
  }
}
