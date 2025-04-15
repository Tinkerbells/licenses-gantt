import type { GanttChartConfig } from '@/types/license.types'

/**
 * Дефолтная конфигурация для диаграммы Ганта
 */
export const DEFAULT_GANTT_CONFIG: GanttChartConfig = {
  width: 1200,
  height: 800,
  margin: {
    top: 60,
    right: 40,
    bottom: 50,
    left: 60,
  },
  elementHeight: 30,
  padding: 5,
  dateFormat: {
    year: '%Y',
    quarter: 'Q%q %Y',
    month: '%b %Y',
    week: 'W%W',
    day: '%d %b',
  },
}

/**
 * Цветовая схема для элементов диаграммы
 */
export const GANTT_COLORS = {
  element: {
    background: '#f5f5f5',
    backgroundHover: '#e3f2fd',
    border: '#2196f3',
    text: '#333',
    subtext: '#666',
  },
  indicator: {
    active: '#2196f3',
    expired: '#f44336',
    warning: '#ff9800',
  },
  axis: {
    text: '#666',
    line: '#ccc',
    grid: '#e8e8e8',
  },
  brush: {
    selection: 'rgba(33, 150, 243, 0.2)',
    handle: '#2196f3',
  },
}

/**
 * Параметры масштабирования (zoom)
 */
export const ZOOM_CONFIG = {
  scaleExtent: [0.5, 10], // Минимальный и максимальный масштаб
  duration: 300, // Длительность анимации масштабирования в миллисекундах
  easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)', // Функция плавности
}

/**
 * Конфигурация оповещений по статусу лицензий
 */
export const LICENSE_STATUS_CONFIG = {
  warningThresholdDays: 30, // Количество дней до окончания для предупреждения
  criticalThresholdDays: 7, // Количество дней до окончания для критического предупреждения
}

/**
 * Параметры адаптивности для мобильных устройств
 */
export const RESPONSIVE_CONFIG = {
  breakpoints: {
    small: 480,
    medium: 768,
    large: 1024,
  },
  smallScreen: {
    elementHeight: 24,
    margin: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 40,
    },
  },
}
