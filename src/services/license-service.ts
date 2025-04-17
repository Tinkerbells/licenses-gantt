import type { ExtendedLicense, LicensesApiData } from '../types/license.types'

import mockJson from '../data.json'

/**
 * Класс для работы с API лицензий
 */
export class LicenseService {
  /**
   * Получение данных лицензий
   * @returns Promise с данными лицензий
   */
  static async getLicensesData(): Promise<LicensesApiData> {
    try {
      // В реальном проекте здесь был бы fetch запрос к API
      // const response = await fetch('/api/licenses')
      // if (!response.ok) {
      //   throw new Error(`Ошибка запроса: ${response.status}`)
      // }
      // return await response.json()
      return await this.getLocalData()
    }
    catch (error) {
      console.error('Ошибка при загрузке данных лицензий:', error)
      throw error
    }
  }

  /**
   * Получение локальных данных для тестирования
   * @returns Данные лицензий из локального JSON
   */
  static async getLocalData(): Promise<LicensesApiData> {
    try {
    // Используем импортированные данные вместо fetch
      return await new Promise((resolve) => {
        setTimeout(() => {
        // Возвращаем импортированные данные из mockJson
          resolve(mockJson as LicensesApiData)
        }, 800) // Таймаут для имитации загрузки данных
      })
    }
    catch (error) {
      console.error('Ошибка при загрузке локальных данных:', error)
      throw error
    }
  }

  /**
   * Преобразование данных API в формат для диаграммы Ганта
   * @param data Данные от API
   * @returns Массив расширенных данных лицензий для визуализации
   */
  static prepareGanttData(data: LicensesApiData): ExtendedLicense[] {
    const extendedLicenses: ExtendedLicense[] = []

    // Обрабатываем каждую лицензию из полученных данных
    data.licenses.forEach((license) => {
      // Создаем дату окончания лицензии
      const endDate = new Date(license.expirationDate)

      extendedLicenses.push({
        id: `lic-${license.id}`,
        title: license.articleCode,
        company: license.customer,
        date: license.expirationDate,
        amount: license.quantity,
        endDate, // Только дата окончания
        position: 0, // Будет рассчитано позже
        status: 'active', // Будет рассчитано позже
        articleCode: license.articleCode,
        productName: license.licenseName || undefined,
        term: license.term,
        unitPrice: license.unitPrice,
        totalPrice: license.totalPrice,
      })
    })

    // Рассчитываем дополнительные поля для визуализации
    return this.calculateVisualizationParams(extendedLicenses)
  }

  /**
   * Расчет параметров визуализации для лицензий
   * @param licenses Базовые данные лицензий
   * @returns Расширенные данные с параметрами для визуализации
   */
  private static calculateVisualizationParams(licenses: ExtendedLicense[]): ExtendedLicense[] {
    // Сортируем по дате окончания и компании
    const sortedLicenses = [...licenses].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()

      if (dateA === dateB) {
        return a.company.localeCompare(b.company)
      }
      return dateA - dateB
    })

    const now = new Date()

    // Рассчитываем параметры для каждой лицензии
    return sortedLicenses.map((license, index) => {
      // Определяем вертикальную позицию (20% до 120% с равномерным распределением)
      const position = 20 + (index * 500) / (sortedLicenses.length > 1 ? sortedLicenses.length - 1 : 1)

      // Определяем статус лицензии
      let status: 'active' | 'expired' | 'renewal'

      if (new Date(license.date) < now) {
        status = 'expired'
      }
      else if (new Date(license.date).getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
        // Если до истечения меньше 30 дней
        status = 'renewal'
      }
      else {
        status = 'active'
      }

      return {
        ...license,
        position,
        status,
      }
    })
  }
}
