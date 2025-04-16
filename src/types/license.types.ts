/**
 * Интерфейс для данных лицензии из API
 */
export interface LicenseData {
  id: number
  expirationDate: string
  customer: string
  articleCode: string
  productName: string
  licenseTerm: string
  quantity: number
}

/**
 * Интерфейс для данных о продукте
 */
export interface Product {
  articleCode: string
  name: string
  licenseYears: number
  totalQuantity: number
}

/**
 * Интерфейс для информации о компании
 */
export interface Company {
  id: number
  name: string
  totalLicenses: number
  products: {
    articleCode: string
    quantity: number
  }[]
  expirationDates: {
    date: string
    quantity: number
  }[]
}

/**
 * Интерфейс для данных о сроках истечения лицензий
 */
export interface Expiration {
  date: string
  totalLicenses: number
  companies: {
    name: string
    licenses: number
    products: {
      articleCode: string
      quantity: number
    }[]
  }[]
}

/**
 * Интерфейс для суммарной информации по лицензиям
 */
export interface Summary {
  totalLicenses: number
  companiesCount: number
  productsCount: number
  nextExpiringLicenses: {
    date: string
    quantity: number
    company: string
  }[]
  productDistribution: {
    articleCode: string
    name: string
    quantity: number
    percentage: number
  }[]
  topCompanies: {
    name: string
    licenses: number
    percentage: number
  }[]
  licensesByMonth: {
    month: string
    quantity: number
  }[]
}

/**
 * Полный набор данных, получаемый от API
 */
export interface LicensesApiData {
  companies: Company[]
  products: Product[]
  expirations: Expiration[]
  licenses: LicenseData[]
  summary: Summary
}

/**
 * Расширенный интерфейс лицензии для внутреннего использования в компоненте
 * с дополнительными полями для отображения на диаграмме
 */
export interface ExtendedLicense {
  id: string // Уникальный идентификатор для React key
  title: string // Идентификатор или артикул лицензии
  company: string // Название компании
  date: string // Дата окончания лицензии в формате YYYY-MM-DD
  amount: number // Количество лицензий
  startDate: Date // Дата начала отображения на диаграмме
  endDate: Date // Дата окончания отображения на диаграмме
  position: number // Позиция по вертикали (процент)
  status: 'active' | 'expired' | 'renewal' // Статус лицензии
  articleCode?: string // Артикул продукта
  productName?: string // Название продукта
}

/**
 * Интерфейс для настроек диаграммы
 */
export interface GanttChartConfig {
  width: number // Ширина диаграммы
  height: number // Высота диаграммы
  margin: { // Отступы диаграммы
    top: number
    right: number
    bottom: number
    left: number
  }
  elementHeight: number // Высота элемента лицензии
  padding: number // Отступ между элементами
  dateFormat: { // Форматы для разных уровней детализации дат
    year: string
    quarter: string
    month: string
    week: string
    day: string
  }
}

/**
 * Тип для определения уровня детализации дат
 */
export type DateGranularity = 'year' | 'quarter' | 'month' | 'week' | 'day'
