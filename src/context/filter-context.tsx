import type { ReactNode } from 'react'

import { useLocation } from 'react-router'
import React, { createContext, useContext, useEffect, useState } from 'react'

import type { DataSource } from '@/services/license-service'
import type { LicensesApiData } from '@/types/license.types'

import { root } from '@/shared/router'
import { LicenseService } from '@/services/license-service'

// Интерфейс для описания данных агрегации
export interface AggregationData {
  dates: string[]
  prices: number[]
  company?: string
}

// Интерфейс для контекста фильтрации
interface FilterContextType {
  // Данные лицензий
  licensesData: LicensesApiData
  loading: boolean
  error: string | null
  dataSource: DataSource

  // Общие фильтры (влияют на все компоненты)
  dateRange: [Date | null, Date | null]
  setDateRange: (range: [Date | null, Date | null]) => void

  // Фильтры для графика агрегации
  selectedCompany: string | null
  setSelectedCompany: (company: string | null) => void

  // Фильтры для графика детализации
  selectedVendor: string[] | null
  setSelectedVendor: (vendor: string[] | null) => void

  // Геттеры данных
  getCompanyList: () => string[]
  getVendorList: () => string[]

  // Получение данных с учетом только релевантных фильтров
  getAllCompaniesAggregationData: () => AggregationData
  getAggregationData: () => AggregationData
  getDetailData: () => { name: string, data: { x: number, y: number }[] }[]
  // Метод для получения данных по одному вендору
  getDetailDataForVendor: (vendor: string) => { name: string, data: { x: number, y: number }[] } | null

}

// Создание контекста с начальными значениями
const FilterContext = createContext<FilterContextType>({
  licensesData: [],
  loading: true,
  error: null,
  dataSource: 'home',

  selectedCompany: null,
  setSelectedCompany: () => {},
  selectedVendor: null,
  setSelectedVendor: () => {},
  dateRange: [null, null],
  setDateRange: () => {},

  getCompanyList: () => [],
  getVendorList: () => [],
  getAggregationData: () => ({ dates: [], prices: [] }),
  getAllCompaniesAggregationData: () => ({ dates: [], prices: [] }),
  getDetailData: () => [],
  getDetailDataForVendor: () => null,
})

// Интерфейс для пропсов провайдера
interface FilterProviderProps {
  children: ReactNode
}

// Функция для определения источника данных на основе пути
function getDataSourceFromPath(pathname: string): DataSource {
  if (pathname.includes('/status') || pathname.includes('#/status')) {
    return 'status'
  }
  return 'home'
}

// Провайдер контекста
export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  // Получаем текущий путь
  const location = useLocation()

  // Состояния для данных
  const [licensesData, setLicensesData] = useState<LicensesApiData>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<DataSource>(getDataSourceFromPath(location.pathname))

  // Состояния для фильтров
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<string[] | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])

  // Загрузка данных
  const fetchData = async (source: DataSource) => {
    setLoading(true)
    setError(null)

    try {
      console.log(`Загрузка данных для источника: ${source}`)
      const data = await LicenseService.getLicensesData(source)
      setLicensesData(data)
    }
    catch (err) {
      setError('Ошибка при загрузке данных лицензий')
      console.error('Ошибка при загрузке данных:', err)
    }
    finally {
      setLoading(false)
    }
  }

  // Обновляем источник данных при изменении маршрута
  useEffect(() => {
    const newDataSource = getDataSourceFromPath(location.pathname)

    // Если источник данных изменился, обновляем его и загружаем новые данные
    if (newDataSource !== dataSource) {
      setDataSource(newDataSource)
      fetchData(newDataSource)
    }
  }, [location.pathname])

  // Начальная загрузка данных
  useEffect(() => {
    fetchData(dataSource)
  }, [])

  // Получение списка компаний из данных
  const getCompanyList = (): string[] => {
    if (!licensesData.length)
      return []

    // Получаем уникальные названия компаний
    const companies = Array.from(new Set(licensesData.map(license => license.customer)))
    return companies.sort()
  }

  // Получение списка вендоров/артикулов из данных
  const getVendorList = (): string[] => {
    if (!licensesData.length)
      return []

    // Получаем уникальные значения вендоров
    const vendors = Array.from(new Set(licensesData.map(license => license.vendor)))
      .filter(Boolean) // Удаляем пустые значения
      .sort() // Сортируем по алфавиту

    return vendors
  }
  const getAllCompaniesAggregationData = (): AggregationData => {
    if (!licensesData.length)
      return { dates: [], prices: [] }

    // Всегда используем все компании, игнорируя selectedCompany
    const filteredData = licensesData

    // Применяем только фильтр дат
    const dateFilteredData = filteredData.filter((license) => {
      const licenseDate = new Date(license.expirationDate)

      const startFilter = dateRange[0]
        ? licenseDate >= dateRange[0]
        : true

      const endFilter = dateRange[1]
        ? licenseDate <= dateRange[1]
        : true

      return startFilter && endFilter
    })

    // Группируем данные по датам и суммируем стоимость
    const aggregatedData: Record<string, number> = {}

    dateFilteredData.forEach((license) => {
      const date = license.expirationDate

      if (!aggregatedData[date]) {
        aggregatedData[date] = 0
      }

      aggregatedData[date] += license.totalPrice
    })

    // Сортируем даты
    const sortedDates = Object.keys(aggregatedData).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime(),
    )

    // Формируем массивы для графика
    const dates = sortedDates
    const prices = sortedDates.map(date => aggregatedData[date])

    return {
      dates,
      prices,
      company: 'Все компании',
    }
  }

  // Получение данных для агрегационного графика - использует ТОЛЬКО фильтры компании и даты
  const getAggregationData = (): AggregationData => {
    if (!licensesData.length)
      return { dates: [], prices: [] }

    // Фильтруем данные по выбранной компании, если она указана
    const filteredData = selectedCompany
      ? licensesData.filter(license => license.customer === selectedCompany)
      : licensesData

    // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: не применяем фильтр вендора для графика агрегации
    const dateFilteredData = filteredData.filter((license) => {
      const licenseDate = new Date(license.expirationDate)

      const startFilter = dateRange[0]
        ? licenseDate >= dateRange[0]
        : true

      const endFilter = dateRange[1]
        ? licenseDate <= dateRange[1]
        : true

      return startFilter && endFilter
    })

    // Группируем данные по датам и суммируем стоимость
    const aggregatedData: Record<string, number> = {}

    dateFilteredData.forEach((license) => {
      const date = license.expirationDate

      if (!aggregatedData[date]) {
        aggregatedData[date] = 0
      }

      aggregatedData[date] += license.totalPrice
    })

    // Сортируем даты
    const sortedDates = Object.keys(aggregatedData).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime(),
    )

    // Формируем массивы для графика
    const dates = sortedDates
    const prices = sortedDates.map(date => aggregatedData[date])

    return {
      dates,
      prices,
      company: selectedCompany || 'Выберите компанию',
    }
  }

  // Получение данных для графика детализации - использует ТОЛЬКО фильтры вендора и даты
  const getDetailData = () => {
    if (!licensesData.length || !selectedVendor || selectedVendor.length === 0) {
      return []
    }

    // Используем только фильтр вендора, НЕ применяем фильтр компании
    return selectedVendor.map((vendor) => {
      // Фильтруем данные только по вендору
      const vendorData = licensesData.filter(license => license.vendor === vendor)

      // Применяем фильтр по диапазону дат, если он установлен
      const dateFilteredData = vendorData.filter((license) => {
        const licenseDate = new Date(license.expirationDate)

        // Проверяем, что дата корректно спарсилась
        if (Number.isNaN(licenseDate.getTime())) {
          return false
        }

        const startFilter = dateRange[0] ? licenseDate >= dateRange[0] : true
        const endFilter = dateRange[1] ? licenseDate <= dateRange[1] : true
        return startFilter && endFilter
      })

      // Группируем по датам и суммируем
      const groupedByDate: Record<string, number> = {}
      dateFilteredData.forEach((license) => {
        const date = license.expirationDate
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0
        }
        groupedByDate[date] += license.totalPrice
      })

      // Сортируем даты в хронологическом порядке
      const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
        const dateA = new Date(a)
        const dateB = new Date(b)
        return dateA.getTime() - dateB.getTime()
      })

      // Формируем массив точек для графика
      const points = sortedDates.map((date) => {
        const jsDate = new Date(date)

        return {
          x: jsDate.getTime(),
          y: groupedByDate[date], // Преобразуем в тысячи рублей
        }
      })

      return {
        name: vendor,
        data: points,
      }
    }).filter(series => series.data.length > 0) // Убираем пустые серии
  }

  // ИЗМЕНЕНО: метод для получения данных по одному конкретному вендору
  // Теперь НЕ применяет фильтр по компании - графики вендоров должны быть независимы
  const getDetailDataForVendor = (vendor: string) => {
    if (!licensesData.length || !vendor) {
      return null
    }

    // Фильтруем данные только по указанному вендору
    const vendorData = licensesData.filter(license => license.vendor === vendor)

    // ИЗМЕНЕНО: НЕ применяем фильтр по выбранной компании
    // const companyFilteredData = selectedCompany
    //   ? vendorData.filter(license => license.customer === selectedCompany)
    //   : vendorData

    // Применяем фильтр по диапазону дат, если он установлен
    const dateFilteredData = vendorData.filter((license) => {
      const licenseDate = new Date(license.expirationDate)

      // Проверяем, что дата корректно спарсилась
      if (Number.isNaN(licenseDate.getTime())) {
        return false
      }

      const startFilter = dateRange[0] ? licenseDate >= dateRange[0] : true
      const endFilter = dateRange[1] ? licenseDate <= dateRange[1] : true
      return startFilter && endFilter
    })

    // Группируем по датам и суммируем
    const groupedByDate: Record<string, number> = {}
    dateFilteredData.forEach((license) => {
      const date = license.expirationDate
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0
      }
      groupedByDate[date] += license.totalPrice
    })

    // Если нет данных, возвращаем пустой массив
    if (Object.keys(groupedByDate).length === 0) {
      return {
        name: vendor,
        data: [],
      }
    }

    // Сортируем даты в хронологическом порядке
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateA.getTime() - dateB.getTime()
    })

    // Формируем массив точек для графика
    const points = sortedDates.map((date) => {
      const jsDate = new Date(date)

      return {
        x: jsDate.getTime(),
        y: groupedByDate[date], // Преобразуем в тысячи рублей
      }
    })

    return {
      name: vendor,
      data: points,
    }
  }

  // Значение контекста
  const value: FilterContextType = {
    licensesData,
    loading,
    error,
    dataSource,

    selectedCompany,
    setSelectedCompany,
    selectedVendor,
    setSelectedVendor,
    dateRange,
    setDateRange,

    getCompanyList,
    getVendorList,
    getAllCompaniesAggregationData,
    getAggregationData,
    getDetailData,
    getDetailDataForVendor,
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilter = () => useContext(FilterContext)
