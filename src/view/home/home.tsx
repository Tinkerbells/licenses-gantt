import './home.styles.css'

import { Flex } from '@tinkerbells/xenon-ui'

import { VendorsContainer } from '../vendor-chart/vendor-container'
import { AggregationChart } from '../aggregation-chart/aggregation-chart'

export function Home() {
  return (
    <Flex justify="center" align="start" className="home-page">
      <Flex gap="small" className="charts-container">
        <AggregationChart />
        <VendorsContainer />
      </Flex>
    </Flex>
  )
}
