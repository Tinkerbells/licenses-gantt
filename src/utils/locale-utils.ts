import * as d3 from 'd3'

/**
 * Устанавливает русскую локализацию для D3 Time Format
 * @returns Объект с настройками локализации
 */
export function setupRussianLocale() {
  return d3.timeFormatDefaultLocale({
    dateTime: '%d.%m.%Y, %H:%M:%S',
    date: '%d.%m.%Y',
    time: '%H:%M:%S',
    periods: ['', ''], // В русском нет AM/PM
    days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    shortDays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    shortMonths: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  })
}

/**
 * Месяцы в различных падежах для корректного склонения в датах
 */
export const RussianMonths = {
  // Именительный падеж (Какой? Кто?)
  nominative: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  // Родительный падеж (Кого? Чего?)
  genitive: ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'],
  // Короткие названия
  short: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
}

/**
 * Получает название месяца в нужном падеже
 * @param month Номер месяца (0-11)
 * @param padezh Падеж (родительный = 'genitive' | именительный = 'nominative')
 * @param isShort Использовать короткое название
 * @returns Название месяца
 */
export function getRussianMonth(month: number, padezh: 'genitive' | 'nominative' = 'nominative', isShort: boolean = false): string {
  if (isShort)
    return RussianMonths.short[month]
  return padezh === 'genitive' ? RussianMonths.genitive[month] : RussianMonths.nominative[month]
}

/**
 * Форматирует даты с учетом русского языка и склонений
 * @param date Дата для форматирования
 * @param granularity Уровень детализации
 * @param isShort Использовать короткое название
 * @returns Отформатированная строка даты
 */
export function formatRussianDate(date: Date, granularity: string, isShort: boolean = false): string {
  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()

  switch (granularity) {
    case 'day':
      return `${day} ${getRussianMonth(month, 'genitive', isShort)}`
    case 'week': {
      // Получаем номер недели в году
      const firstDayOfYear = new Date(year, 0, 1)
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
      return isShort ? `Нед.${weekNumber}` : `Неделя ${weekNumber}, ${getRussianMonth(month, 'genitive')}`
    }
    case 'month':
      return isShort
        ? getRussianMonth(month, 'nominative', true)
        : `${getRussianMonth(month, 'nominative')} ${year}`
    case 'quarter': {
      const quarter = Math.floor(month / 3) + 1
      return isShort ? `К${quarter}` : `Квартал ${quarter}, ${year}`
    }
    case 'year':
      return year.toString()
    default:
      return `${day} ${getRussianMonth(month, 'genitive', isShort)} ${year}`
  }
}
