/**
 * Интерфейс для данных лицензии
 */
export interface License {
  title: string // Идентификатор лицензии
  company: string // Название компании
  date: string // Дата окончания лицензии в формате YYYY-MM-DD
  amount: number // Количество лицензий
}

/**
 * Интерфейс для ответа API с лицензиями
 */
export interface LicensesData {
  licenses: License[]
}

/**
 * Расширенный интерфейс лицензии для внутреннего использования в компоненте
 * с дополнительными полями для отображения на диаграмме
 */
export interface ExtendedLicense extends License {
  id: string // Уникальный идентификатор для React key
  startDate: Date // Дата начала отображения на диаграмме
  endDate: Date // Дата окончания отображения на диаграмме
  position: number // Позиция по вертикали (процент)
  status: 'active' | 'expired' | 'renewal' // Статус лицензии
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
  barHeight: number // Высота элемента лицензии
  barPadding: number // Отступ между элементами
  brushHeight: number // Высота горизонтального brush
  vBrushWidth: number // Ширина вертикального brush
}

/**
 * Тип для определения уровня детализации дат
 */
export type DateGranularity = 'year' | 'quarter' | 'month' | 'week' | 'day'
