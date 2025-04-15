export interface License {
  title: string // Идентификатор лицензии
  company: string // Название компании
  date: string // Дата окончания лицензии в формате ISO
  amount: number // Количество лицензий
}

export interface LicensesData {
  licenses: License[]
}

// Расширенная информация о лицензии для отображения на диаграмме
export interface LicenseItem extends License {
  id: string // Уникальный идентификатор для React
  startDate: Date // Дата начала действия лицензии
  endDate: Date // Дата окончания действия лицензии
  lane: number // Позиция на вертикальной оси (строка)
  progress?: number // Процент выполнения (0-100)
  status?: 'active' | 'expired' | 'pending' // Статус лицензии
}

// Параметры фильтрации
export interface FilterParams {
  startDate?: Date
  endDate?: Date
  client?: string
  licenseType?: string
}

// Настройки отображения диаграммы
export interface GanttChartConfig {
  width: number
  height: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
  itemHeight: number
  itemMargin: number
  minZoom: number
  maxZoom: number
}

// Уровни детализации временной шкалы
export enum TimeScale {
  YEAR = 'year',
  QUARTER = 'quarter',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
}

// Состояние кисти выбора (brush)
export interface BrushState {
  horizontal: [Date, Date] | null
  vertical: [number, number] | null
}

// События диаграммы
export interface GanttChartEvents {
  onLicenseClick?: (license: LicenseItem) => void
  onBrushEnd?: (brushState: BrushState) => void
  onZoom?: (scale: number, translate: [number, number]) => void
}
