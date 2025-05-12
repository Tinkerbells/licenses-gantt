import './status.styles.css'
import { Flex } from '@tinkerbells/xenon-ui'

import { LicenseGanttChart } from '../gantt/gantt-chart'

export function Status() {
  return (
    <Flex justify="center" className="status-page">
      <LicenseGanttChart />
    </Flex>
  )
}
