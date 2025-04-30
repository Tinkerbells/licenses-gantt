import type { ReactNode } from 'react'

import React, { createContext, useContext, useEffect, useState } from 'react'

import type { LicensesApiData } from '@/types/license.types'

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

// Провайдер контекста
export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  // Состояния для данных
  const [licensesData, setLicensesData] = useState<LicensesApiData>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Состояния для фильтров
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<string[] | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await LicenseService.getLicensesData()
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

    fetchData()
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

    // Получаем уникальные артикулы (представляющие вендоров)
    const vendors = Array.from(new Set(licensesData.map(license => license.articleCode)))
    return vendors.sort()
  }

  // Получение данных для агрегационного графика
  const getAggregationData = (): AggregationData => {
    if (!licensesData.length)
      return { dates: [], prices: [] }

    // Фильтруем данные по выбранной компании, если она указана
    const filteredData = selectedCompany
      ? licensesData.filter(license => license.customer === selectedCompany)
      : licensesData

    // Фильтруем по вендору, если указан (только первый вендор для агрегационного графика)
    const vendorFilteredData = selectedVendor && selectedVendor.length > 0
      ? filteredData.filter(license => license.articleCode === selectedVendor[0])
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
