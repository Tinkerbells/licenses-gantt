import './home.styles.css'

import { Flex } from '@tinkerbells/xenon-ui'

import { Aggregation } from '../aggregation-chart'
import { VendorsContainer } from '../vendor-chart/vendor-container'

export function Home() {
  return (
    <Flex justify="center" align="start" className="home-page">
      <Flex gap="small" justify="space-between" className="charts-container">
        <Aggregation />
        <VendorsContainer />
      </Flex>
    </Flex>
  )
}
