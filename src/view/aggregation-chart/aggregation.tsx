import './aggregation-chart.styles.css'
import { Flex } from '@tinkerbells/xenon-ui'

import { AllCompaniesChart } from './all-companies-chart'
import { SelectedCompanyChart } from './selected-company-chart'

export function Aggregation() {
  return (
    <Flex vertical className="aggregation-charts-container">
      <AllCompaniesChart />
      <SelectedCompanyChart />
    </Flex>
  )
}
