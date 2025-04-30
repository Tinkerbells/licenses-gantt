import './panel.styles.css'

import type { SelectProps } from '@tinkerbells/xenon-ui'

import { DatePicker, Flex, Select, Spin } from '@tinkerbells/xenon-ui'

import { useFilter } from '@/context/filter-context'

export function Panel() {
  const {
    loading,
    selectedCompany,
    setSelectedCompany,
    selectedVendor,
    setSelectedVendor,
    getCompanyList,
    getVendorList,
  } = useFilter()

  // Получаем списки для выпадающих меню
  const companies = getCompanyList()
  const vendors = getVendorList()

  // Формирование опций для выпадающих списков
  const companyOptions: SelectProps['options'] = companies.map(company => ({
    label: company,
    value: company,
  }))

  const vendorOptions: SelectProps['options'] = vendors.map(vendor => ({
    label: vendor,
    value: vendor,
  }))

  // Добавляем опцию "Все" для компаний
  companyOptions.unshift({ label: 'Все компании', value: '' })

  // Обработчики изменений
  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value || null)
  }

  const handleVendorChange = (values: string[]) => {
    setSelectedVendor(values.length > 0 ? values : null)
  }

  // const handleDateRangeChange = (dates: [Date, Date] | null) => {
  //   setDateRange(dates || [null, null])
  // }

  return (
    <Flex className="panel" wrap="wrap" gap="middle" align="center">
      <DatePicker.RangePicker
        // onChange={handleDateRangeChange}
        // value={dateRange[0] && dateRange[1] ? [dateRange[0], dateRange[1]] : null}
        placeholder={['Начальная дата', 'Конечная дата']}
      />

      <Select
        loading={loading}
        style={{ minWidth: 200 }}
        placeholder="Выберите заказчика"
        options={companyOptions}
        onChange={handleCompanyChange}
        value={selectedCompany || ''}
        allowClear
        showSearch
      />

      <Select
        mode="multiple"
        loading={loading}
        style={{ minWidth: 200 }}
        maxTagCount={3}
        placeholder="Выберите вендор"
        options={vendorOptions}
        onChange={handleVendorChange}
        value={selectedVendor || []}
        allowClear
        showSearch
      />

      {loading && <Spin size="small" />}
    </Flex>
  )
}
