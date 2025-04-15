import type { FilterParams, License, LicensesData } from '../types/license.types'

// Моковые данные для тестирования
const mockLicenseData: LicensesData = {
  licenses: [
    {
      title: 'KL3213RATYS',
      company: 'ООО Добыча нефти',
      date: '2025-06-17',
      amount: 800,
    },
    {
      title: 'ZX9876OPIJK',
      company: 'АО Нефтегаз',
      date: '2025-07-25',
      amount: 1500,
    },
    {
      title: 'MN1234ABC',
      company: 'ООО Энерго-Пром',
      date: '2025-08-03',
      amount: 1200,
    },
    {
      title: 'GH5678JKL',
      company: 'ПАО ТехноНефть',
      date: '2025-09-14',
      amount: 2000,
    },
    {
      title: 'EF9012QWE',
      company: 'ООО Развитие ресурсов',
      date: '2025-10-01',
      amount: 900,
    },
  ],
}

/**
 * Класс для работы с API лицензий
 */
class LicenseService {
  /**
   * Получение списка лицензий с сервера
   * @param params Параметры фильтрации
   * @returns Promise с данными лицензий
   */
  async getLicenses(params?: FilterParams): Promise<LicensesData> {
    // В реальном приложении здесь был бы HTTP-запрос к API
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 500))

    // Применяем фильтры к моковым данным (если параметры переданы)
    if (!params) {
      return mockLicenseData
    }

    let filteredLicenses = [...mockLicenseData.licenses]

    if (params.startDate) {
      filteredLicenses = filteredLicenses.filter(license =>
        new Date(license.date) >= params.startDate!,
      )
    }

    if (params.endDate) {
      filteredLicenses = filteredLicenses.filter(license =>
        new Date(license.date) <= params.endDate!,
      )
    }

    if (params.client) {
      filteredLicenses = filteredLicenses.filter(license =>
        license.company.toLowerCase().includes(params.client!.toLowerCase()),
      )
    }

    if (params.licenseType) {
      filteredLicenses = filteredLicenses.filter(license =>
        license.title.includes(params.licenseType!),
      )
    }

    return { licenses: filteredLicenses }
  }

  /**
   * Получение детальной информации о лицензии
   * @param licenseId Идентификатор лицензии
   * @returns Promise с данными лицензии
   */
  async getLicenseDetails(licenseId: string): Promise<License | null> {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 300))

    const license = mockLicenseData.licenses.find(lic => lic.title === licenseId)
    return license || null
  }

  /**
   * Имитация запроса на сервер в формате, который ожидается для данного проекта
   * @param startDate Начальная дата
   * @param endDate Конечная дата
   * @returns Строка запроса
   */
  generateMockRequest(startDate?: Date, endDate?: Date): string {
    const start = startDate ? startDate.toISOString().split('T')[0] : ''
    const end = endDate ? endDate.toISOString().split('T')[0] : ''

    // Пример структуры запроса, который был бы отправлен на сервер
    const requestBody = {
      method: 'GET',
      url: '/api/licenses',
      params: {
        startDate: start,
        endDate: end,
        includeDetails: true,
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {token}',
      },
    }

    return JSON.stringify(requestBody, null, 2)
  }
}

export const licenseService = new LicenseService()
