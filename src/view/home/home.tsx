import './home.styles.css'
import { Flex } from '@tinkerbells/xenon-ui'

import { LicenseGanttChart } from '../gantt/gantt-chart'
import { DetailChart } from '../detail-chart/detail-chart'
import { AggregationChart } from '../aggregation-chart/aggregation-chart'

export function Home() {
  return (
    <Flex justify="space-between" className="home-page">
      <LicenseGanttChart />
      <Flex vertical gap="small" className="right-charts">
        <AggregationChart />
        <DetailChart />
      </Flex>
    </Flex>
  )
}
