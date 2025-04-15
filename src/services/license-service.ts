import type { License, LicensesData } from '../types/license.types'

/**
 * Моковые данные лицензий для тестирования
 */
const MOCK_LICENSES: License[] = [
  {
    title: 'KL3213RATYS',
    company: 'ООО Добыча нефти',
    date: '2025-06-17',
    amount: 750,
  },
  {
    title: 'ZX9876OPIJK',
    company: 'ООО Добыча нефти',
    date: '2025-07-25',
    amount: 750,
  },
  {
    title: 'MN1234ABC',
    company: 'ООО Добыча нефти',
    date: '2025-08-03',
    amount: 750,
  },
  {
    title: 'GH5678JKL',
    company: 'ООО Добыча нефти',
    date: '2025-09-14',
    amount: 750,
  },
  {
    title: 'EF9012QWE',
    company: 'ООО Добыча нефти',
    date: '2025-10-01',
    amount: 750,
  },
  {
    title: 'AB3456RST',
    company: 'ООО Добыча нефти',
    date: '2024-04-15',
    amount: 750,
  },
  {
    title: 'CD7890UVW',
    company: 'ООО Добыча нефти',
    date: '2024-05-20',
    amount: 750,
  },
  {
    title: 'EF1234XYZ',
    company: 'ООО Добыча нефти',
    date: '2024-06-10',
    amount: 750,
  },
  {
    title: 'GH5678ABC',
    company: 'ООО Добыча нефти',
    date: '2024-07-05',
    amount: 750,
  },
  {
    title: 'IJ9012DEF',
    company: 'ООО Добыча нефти',
    date: '2024-08-22',
    amount: 750,
  },
  {
    title: 'KL3456GHI',
    company: 'ООО Добыча нефти',
    date: '2024-09-18',
    amount: 750,
  },
  {
    title: 'MN7890JKL',
    company: 'ООО Добыча нефти',
    date: '2024-10-07',
    amount: 750,
  },
  {
    title: 'OP1234MNO',
    company: 'ООО Добыча нефти',
    date: '2024-11-12',
    amount: 750,
  },
  {
    title: 'QR5678PQR',
    company: 'ООО Добыча нефти',
    date: '2024-12-01',
    amount: 750,
  },
  {
    title: 'ST9012STU',
    company: 'ООО Добыча нефти',
    date: '2025-01-15',
    amount: 750,
  },
  {
    title: 'UV3456VWX',
    company: 'ООО Добыча нефти',
    date: '2025-02-28',
    amount: 750,
  },
  {
    title: 'WX7890YZA',
    company: 'ООО Добыча нефти',
    date: '2025-03-10',
    amount: 750,
  },
  {
    title: 'YZ1234BCD',
    company: 'ООО Добыча нефти',
    date: '2025-04-05',
    amount: 750,
  },
  {
    title: 'AC5678EFG',
    company: 'ООО Добыча нефти',
    date: '2025-05-20',
    amount: 750,
  },
  {
    title: 'BD9012HIJ',
    company: 'ООО Добыча нефти',
    date: '2025-06-15',
    amount: 750,
  },
  {
    title: 'CE3456KLM',
    company: 'ООО Добыча нефти',
    date: '2025-07-10',
    amount: 750,
  },
  {
    title: 'DF7890NOP',
    company: 'ООО Добыча нефти',
    date: '2025-08-05',
    amount: 750,
  },
  {
    title: 'EG1234QRS',
    company: 'ООО Добыча нефти',
    date: '2025-09-01',
    amount: 750,
  },
  {
    title: 'FH5678TUV',
    company: 'ООО Добыча нефти',
    date: '2025-10-10',
    amount: 750,
  },
  {
    title: 'GI9012WXY',
    company: 'ООО Добыча нефти',
    date: '2025-11-15',
    amount: 750,
  },
  {
    title: 'HJ3456ZAB',
    company: 'ООО Добыча нефти',
    date: '2025-12-20',
    amount: 750,
  },
  {
    title: 'IK7890CDE',
    company: 'ООО Добыча нефти',
    date: '2024-04-25',
    amount: 750,
  },
  {
    title: 'JL1234FGH',
    company: 'ООО Добыча нефти',
    date: '2024-05-15',
    amount: 750,
  },
  {
    title: 'KM5678IJK',
    company: 'ООО Добыча нефти',
    date: '2024-06-20',
    amount: 750,
  },
  {
    title: 'LN9012LMN',
    company: 'ООО Добыча нефти',
    date: '2024-07-25',
    amount: 750,
  },
]

/**
 * Класс для работы с API лицензий
 */
export class LicenseService {
  /**
   * Получение списка лицензий
   * @returns Promise с данными лицензий
   */
  static async getLicenses(): Promise<LicensesData> {
    // Имитация задержки сетевого запроса
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ licenses: MOCK_LICENSES })
      }, 800)
    })
  }

  /**
   * Имитация реального запроса на сервер
   * В реальном проекте здесь был бы настоящий fetch запрос
   */
  static async fetchLicenses(): Promise<LicensesData> {
    // Пример того, как мог бы выглядеть реальный запрос
    /*
    try {
      const response = await fetch('/api/licenses');
      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Ошибка при загрузке лицензий:', error);
      throw error;
    }
    */

    // Вместо этого возвращаем моковые данные
    return this.getLicenses()
  }
}
