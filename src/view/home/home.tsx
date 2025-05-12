import './home.styles.css'
import { Flex } from '@tinkerbells/xenon-ui'

import { DetailChart } from '../detail-chart/detail-chart'
import { AggregationChart } from '../aggregation-chart/aggregation-chart'

export function Home() {
  return (
    <Flex justify="center" align="start" className="home-page">
      <Flex vertical gap="small" className="charts-container">
        <AggregationChart />
        <DetailChart />
      </Flex>
    </Flex>
  )
}
