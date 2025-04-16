import type { ExtendedLicense, LicensesApiData } from '../types/license.types'

import data from '../../data.json'

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
      return data
    }
    catch (error) {
      console.error('Ошибка при загрузке данных лицензий:', error)

      // В случае ошибки используем локальные данные
      const data = await this.getLocalData()
      return data
    }
  }

  /**
   * Получение локальных данных для тестирования
   * @returns Данные лицензий из локального JSON
   */
  static async getLocalData(): Promise<LicensesApiData> {
    try {
      // В реальном проекте здесь бы загружался локальный JSON
      // Для примера возвращаем фиктивный ответ
      return await new Promise((resolve) => {
        setTimeout(() => {
          fetch('/data.json')
            .then(response => response.json())
            .then(data => resolve(data))
            .catch(() => {
              // Если не удалось загрузить локальный JSON, возвращаем минимальные тестовые данные
              resolve({
                companies: [],
                products: [],
                expirations: [],
                licenses: [],
                summary: {
                  totalLicenses: 0,
                  companiesCount: 0,
                  productsCount: 0,
                  nextExpiringLicenses: [],
                  productDistribution: [],
                  topCompanies: [],
                  licensesByMonth: [],
                },
              })
            })
        }, 800)
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

    // Обработка данных из разных источников

    // 1. Берем данные из секции expirations
    data.expirations.forEach((expiration) => {
      expiration.companies.forEach((company) => {
        company.products.forEach((product) => {
          const productDetails = data.products.find(p => p.articleCode === product.articleCode)

          extendedLicenses.push({
            id: `exp-${expiration.date}-${company.name}-${product.articleCode}`,
            title: product.articleCode,
            company: company.name,
            date: expiration.date,
            amount: product.quantity,
            startDate: new Date(), // Будет рассчитано позже
            endDate: new Date(expiration.date),
            position: 0, // Будет рассчитано позже
            status: 'active', // Будет рассчитано позже
            articleCode: product.articleCode,
            productName: productDetails?.name,
          })
        })
      })
    })

    // 2. Дополняем данными из companies, если не все еще учтены
    data.companies.forEach((company) => {
      company.expirationDates.forEach((expDate) => {
        // Проверяем, есть ли уже лицензия с такой компанией и датой
        const exists = extendedLicenses.some(
          lic => lic.company === company.name && lic.date === expDate.date,
        )

        if (!exists) {
          extendedLicenses.push({
            id: `comp-${company.id}-${expDate.date}`,
            title: `Лицензия ${company.name}`,
            company: company.name,
            date: expDate.date,
            amount: expDate.quantity,
            startDate: new Date(), // Будет рассчитано позже
            endDate: new Date(expDate.date),
            position: 0, // Будет рассчитано позже
            status: 'active', // Будет рассчитано позже
          })
        }
      })
    })

    // 3. Добавляем данные из индивидуальных лицензий, если они еще не учтены
    data.licenses.forEach((license) => {
      // Проверяем, есть ли уже лицензия с таким же id или комбинацией компании и даты
      const exists = extendedLicenses.some(
        lic =>
          (lic.id === `lic-${license.id}`)
          || (lic.company === license.customer
            && lic.date === license.expirationDate
            && lic.articleCode === license.articleCode),
      )

      if (!exists) {
        extendedLicenses.push({
          id: `lic-${license.id}`,
          title: license.articleCode,
          company: license.customer,
          date: license.expirationDate,
          amount: license.quantity,
          startDate: new Date(), // Будет рассчитано позже
          endDate: new Date(license.expirationDate),
          position: 0, // Будет рассчитано позже
          status: 'active', // Будет рассчитано позже
          articleCode: license.articleCode,
          productName: license.productName,
        })
      }
    })

    // Расчет дополнительных полей для визуализации
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
      // Рассчитываем дату начала как 3 месяца до даты окончания
      const endDate = new Date(license.date)
      const startDate = new Date(endDate)
      startDate.setMonth(startDate.getMonth() - 3)

      // Определяем вертикальную позицию (20% до 120% с равномерным распределением)
      const position = 20 + (index * 100) / (sortedLicenses.length > 1 ? sortedLicenses.length - 1 : 1)

      // Определяем статус лицензии
      let status: 'active' | 'expired' | 'renewal'

      if (endDate < now) {
        status = 'expired'
      }
      else if (endDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
        // Если до истечения меньше 30 дней
        status = 'renewal'
      }
      else {
        status = 'active'
      }

      return {
        ...license,
        startDate,
        endDate,
        position,
        status,
      }
    })
  }
}
