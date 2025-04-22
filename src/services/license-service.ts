import { env } from '@/shared/env'

import type { ExtendedLicense, LicensesApiData } from '../types/license.types'

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
   * Преобразование данных API в формат для диаграммы Ганта с группировкой по компаниям и датам
   * @param data Данные от API
   * @returns Массив расширенных данных лицензий для визуализации
   */
  static prepareGanttData(data: LicensesApiData): ExtendedLicense[] {
    // Группировка по customer и expirationDate
    const groupedData: Record<string, Record<string, LicensesApiData>> = {}

    // Заполняем структуру группировки
    data.forEach((license) => {
      // Создаем ключ customer, если его еще нет
      if (!groupedData[license.customer]) {
        groupedData[license.customer] = {}
      }

      // Создаем ключ expirationDate для данного customer, если его еще нет
      if (!groupedData[license.customer][license.expirationDate]) {
        groupedData[license.customer][license.expirationDate] = []
      }

      // Добавляем лицензию в соответствующую группу
      groupedData[license.customer][license.expirationDate].push(license)
    })

    const extendedLicenses: ExtendedLicense[] = []

    // Формируем результат на основе группировки
    Object.entries(groupedData).forEach(([customer, dateLicenses]) => {
      Object.entries(dateLicenses).forEach(([date, licenses]) => {
        // Агрегированные значения
        const totalQuantity = licenses.reduce((sum, lic) => sum + lic.quantity, 0)
        const totalPrice = licenses.reduce((sum, lic) => sum + lic.totalPrice, 0)

        // Получаем уникальные articleCode
        const uniqueArticleCodes = Array.from(new Set(licenses.map(lic => lic.articleCode)))

        // Формируем заголовок
        const title = uniqueArticleCodes.length > 1
          ? `${uniqueArticleCodes[0]} (+${uniqueArticleCodes.length - 1})`
          : uniqueArticleCodes[0]

        // Объединяем все articleCode в одну строку для детального просмотра
        const articleCode = uniqueArticleCodes.join(', ')

        // Берем первое непустое имя продукта либо undefined
        const productName = licenses.find(lic => lic.licenseName)?.licenseName || undefined

        // Берем первый непустой срок либо undefined
        const term = licenses.find(lic => lic.term)?.term || undefined

        const endDate = new Date(date)

        // Создаем уникальный ID для группы, заменяя специальные символы для безопасности
        const safeCustomer = customer.replace(/[\s"']/g, '-')
        const id = `lic-group-${safeCustomer}-${date}`

        extendedLicenses.push({
          id,
          title,
          company: customer,
          date,
          amount: totalQuantity,
          endDate,
          position: 0, // Будет рассчитано в calculateVisualizationParams
          status: 'active', // Будет обновлено в calculateVisualizationParams
          articleCode,
          productName,
          term,
          unitPrice: totalPrice / totalQuantity,
          totalPrice,
        })
      })
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
