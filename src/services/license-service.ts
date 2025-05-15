import { env } from '@/shared/env'

import type { ExtendedLicense, LicensesApiData } from '../types/license.types'

// import { generateMockData } from './license-mock'

/**
 * Тип источника данных
 */
export type DataSource = 'home' | 'status'

/**
 * Класс для работы с API лицензий
 */
export class LicenseService {
  /**
   * Получение данных лицензий из выбранного источника
   * @param dataSource Источник данных ('home' или 'status')
   * @returns Promise с данными лицензий
   */
  static async getLicensesData(dataSource: DataSource = 'home'): Promise<LicensesApiData> {
    try {
      // В реальном проекте здесь мог бы быть fetch к API:
      //   const response = await fetch('/api/licenses')
      //   if (!response.ok) throw new Error(`Ошибка запроса: ${response.status}`)
      //   return await response.json()

      // А пока — читаем локальный JSON из public/
      // if (env.NODE_ENV === 'development') {
      //   return generateMockData(100)
      // }
      return await this.getLocalData(dataSource)
    }
    catch (error) {
      console.error('Ошибка при загрузке данных лицензий:', error)
      throw error
    }
  }

  /**
   * Получение локальных данных для тестирования
   * @param dataSource Источник данных ('home' или 'status')
   * @returns Данные лицензий из выбранного JSON файла
   */
  private static async getLocalData(dataSource: DataSource): Promise<LicensesApiData> {
    // Выбираем файл в зависимости от источника данных
    const dataFile = dataSource === 'status' ? 'data-short.json' : 'data.json'

    console.log(`Загрузка данных из: ${dataFile} для страницы ${dataSource}`)

    const response = await fetch(`${env.BASE_URL}/${dataFile}`, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json; charset=UTF-8',
      },
    })
    if (!response.ok) {
      throw new Error(`Не удалось загрузить локальные данные по адресу ${env.BASE_URL}/${dataFile}: ${response.status}`)
    }
    // небольшая искусственная задержка, если хотите имитировать загрузку
    await new Promise(r => setTimeout(r, 800))
    return response.json()
  }

  /**
   * Преобразование данных API в формат для диаграммы Ганта без группировки
   * @param data Данные от API
   * @returns Массив расширенных данных лицензий для визуализации
   */
  static prepareGanttData(data: LicensesApiData): ExtendedLicense[] {
    // Преобразуем каждый элемент LicenseData в ExtendedLicense без группировки
    const extendedLicenses = data.map((license) => {
      // Создаем уникальный ID для элемента
      const safeCustomer = license.customer.replace(/[\s"']/g, '-')
      const id = `lic-${license.id}-${safeCustomer}`

      return {
        id,
        title: license.articleCode,
        company: license.customer,
        date: license.expirationDate,
        amount: license.quantity,
        endDate: new Date(license.expirationDate),
        position: 0,
        status: 'active',
        articleCode: license.articleCode,
        vendor: license.vendor, // Добавлено поле vendor
        productName: license.licenseName || undefined,
        term: license.term || undefined,
        unitPrice: license.unitPrice,
        totalPrice: license.totalPrice,
      } as ExtendedLicense
    })

    return this.calculateVisualizationParams(extendedLicenses)
  }

  /**
   * Расчет параметров визуализации для лицензий
   * @param licenses Базовые данные лицензий
   * @returns Расширенные данные с параметрами для визуализации
   */
  private static calculateVisualizationParams(licenses: ExtendedLicense[]): ExtendedLicense[] {
    const sorted = [...licenses].sort((a, b) => {
      const tA = new Date(a.date).getTime()
      const tB = new Date(b.date).getTime()
      return tA === tB ? a.company.localeCompare(b.company) : tA - tB
    })

    const now = Date.now()
    return sorted.map((lic, i) => {
      const position = 20 + (i * 1000) / (sorted.length > 1 ? sorted.length - 1 : 1)
      const expiresAt = new Date(lic.date).getTime()

      let status: 'active' | 'expired' | 'renewal'
      if (expiresAt < now)
        status = 'expired'
      else if (expiresAt - now < 30 * 24 * 60 * 60 * 1000)
        status = 'renewal'
      else status = 'active'

      return { ...lic, position, status }
    })
  }
}
