/**
 * Файл: license-service.ts
 * Путь: src/services/license-service.ts
 *
 * Описание: Сервис для работы с данными лицензий без группировки
 */

import { env } from '@/shared/env'

import type { ExtendedLicense, LicensesApiData } from '../types/license.types'

import { generateMockData } from './license-mock'

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
      // В реальном проекте здесь мог бы быть fetch к API:
      //   const response = await fetch('/api/licenses')
      //   if (!response.ok) throw new Error(`Ошибка запроса: ${response.status}`)
      //   return await response.json()

      // А пока — читаем локальный JSON из public/
      if (env.NODE_ENV === 'development') {
        return generateMockData(100)
      }
      return await this.getLocalData()
    }
    catch (error) {
      console.error('Ошибка при загрузке данных лицензий:', error)
      throw error
    }
  }

  /**
   * Получение локальных данных для тестирования
   * @returns Данные лицензий из public/data.json
   */
  private static async getLocalData(): Promise<LicensesApiData> {
    const response = await fetch(`${env.BASE_URL}/data.json`)
    if (!response.ok) {
      throw new Error(`Не удалось загрузить локальные данные по адресу ${env.BASE_URL}/data.json: ${response.status}`)
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
        position: 0, // Будет рассчитано в calculateVisualizationParams
        status: 'active', // Будет обновлено в calculateVisualizationParams
        articleCode: license.articleCode,
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
      const position = 20 + (i * 500) / (sorted.length > 1 ? sorted.length - 1 : 1)
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
