/**
 * Файл: event-optimizers.ts
 * Путь: src/utils/event-optimizers.ts
 *
 * Описание: Утилиты для оптимизации обработки событий с помощью тротлинга и дебаунсинга
 */

/**
 * Тротлинг функции - ограничивает частоту вызовов функции
 * @param func Исходная функция
 * @param limit Минимальный интервал между вызовами в миллисекундах
 * @returns Тротлинг-обертка над функцией
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0
  let lastArgs: Parameters<T> | null = null
  let timeout: number | null = null

  return function (...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now()

    // Сохраняем последние аргументы для отложенного вызова
    lastArgs = args

    if (now - lastCall >= limit) {
      // Если прошло достаточно времени, вызываем функцию немедленно
      lastCall = now
      return func(...args)
    }
    else if (!timeout) {
      // Если прошло недостаточно времени, запланируем вызов на будущее
      timeout = window.setTimeout(() => {
        timeout = null
        lastCall = Date.now()
        if (lastArgs)
          func(...lastArgs)
      }, limit - (now - lastCall))
    }

    return undefined
  }
}

/**
 * Дебаунсинг функции - откладывает вызов до тех пор, пока не пройдет указанное время после последнего вызова
 * @param func Исходная функция
 * @param wait Время ожидания в миллисекундах
 * @returns Дебаунсинг-обертка над функцией
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: number | null = null

  return function (...args: Parameters<T>): void {
    if (timeout !== null) {
      clearTimeout(timeout)
    }

    timeout = window.setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Комбинированный тротлинг и дебаунсинг функции
 * - тротлинг для ограничения частоты вызовов во время активного использования
 * - дебаунсинг для выполнения последнего вызова после прекращения активности
 *
 * @param func Исходная функция
 * @param throttleLimit Минимальный интервал между вызовами
 * @param debounceWait Время ожидания для последнего вызова
 * @returns Оптимизированная функция
 */
export function throttleAndDebounce<T extends (...args: any[]) => any>(
  func: T,
  throttleLimit: number,
  debounceWait: number,
): (...args: Parameters<T>) => void {
  const throttled = throttle(func, throttleLimit)
  const debounced = debounce(func, debounceWait)

  return function (...args: Parameters<T>): void {
    throttled(...args)
    debounced(...args)
  }
}
