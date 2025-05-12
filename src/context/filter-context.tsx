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

  // Фильтры
  selectedCompany: string | null
  setSelectedCompany: (company: string | null) => void
  selectedVendor: string[] | null // Изменено на массив строк
  setSelectedVendor: (vendor: string[] | null) => void
  dateRange: [Date | null, Date | null]
  setDateRange: (range: [Date | null, Date | null]) => void

  // Геттеры данных
  getCompanyList: () => string[]
  getVendorList: () => string[]
  getAggregationData: () => AggregationData
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
})

// Интерфейс для пропсов провайдера
interface FilterProviderProps {
  children: ReactNode
}

// Функция для определения источника данных на основе пути
function getDataSourceFromPath(pathname: string): DataSource {
  if (pathname.includes(root.status.$path())) {
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

  // Получение данных для агрегационного графика
  const getAggregationData = (): AggregationData => {
    if (!licensesData.length)
      return { dates: [], prices: [] }

    // Фильтруем данные по выбранной компании, если она указана
    const filteredData = selectedCompany
      ? licensesData.filter(license => license.customer === selectedCompany)
      : licensesData

    const vendorFilteredData = selectedVendor && selectedVendor.length > 0
      ? filteredData.filter(license => selectedVendor.includes(license.vendor))
      : filteredData

    // Фильтруем по диапазону дат, если указан
    const dateFilteredData = vendorFilteredData.filter((license) => {
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
      company: selectedCompany || 'Все компании',
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
    getAggregationData,
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

// Хук для использования контекста
export const useFilter = () => useContext(FilterContext)
