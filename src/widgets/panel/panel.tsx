import './panel.styles.css'

import type { Dayjs } from 'dayjs'
import type { RangePickerProps, SelectProps } from '@tinkerbells/xenon-ui'

import dayjs from 'dayjs'
import { DatePicker, Flex, Select } from '@tinkerbells/xenon-ui'

import { useFilter } from '@/context/filter-context'

export function Panel() {
  const {
    loading,
    selectedCompany,
    setSelectedCompany,
    selectedVendor,
    setSelectedVendor,
    dateRange,
    setDateRange,
    getCompanyList,
    getVendorList,
  } = useFilter()

  const companies = getCompanyList()
  const vendors = getVendorList()

  const companyOptions: SelectProps['options'] = companies.map(company => ({
    label: company,
    value: company,
  }))

  const vendorOptions: SelectProps['options'] = vendors.map(vendor => ({
    label: vendor,
    value: vendor,
  }))

  companyOptions.unshift({ label: 'Все компании', value: '' })

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value || null)
  }

  const handleVendorChange = (values: string[]) => {
    setSelectedVendor(values.length > 0 ? values : null)
  }

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      setDateRange([null, null])
      return
    }

    // Преобразуем Dayjs в JavaScript Date
    const startDate = dates[0].toDate()
    const endDate = dates[1].toDate()

    setDateRange([startDate, endDate])
  }

  const dayjsValue: [Dayjs | null, Dayjs | null] | null
    = dateRange[0] && dateRange[1]
      ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
      : null

  return (
    <Flex className="panel" wrap="wrap" gap="middle" align="center">
      <DatePicker.RangePicker
        onChange={handleDateRangeChange}
        value={dayjsValue}
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
        style={{ minWidth: 200, maxWidth: 800 }}
        maxTagCount={1}
        placeholder="Выберите вендор"
        options={vendorOptions}
        onChange={handleVendorChange}
        value={selectedVendor || []}
        allowClear
        showSearch
      />
    </Flex>
  )
}
