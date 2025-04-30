import './panel.styles.css'
import { DatePicker, Flex, Select, Typography } from '@tinkerbells/xenon-ui'

export function Panel() {
  return (
    <Flex className="panel">
      <Flex>
        <DatePicker.RangePicker />
        <Select labelRender={() => <Typography>Заказчик</Typography>} />
        <Select labelRender={() => <Typography>Вендор</Typography>} />
      </Flex>
    </Flex>
  )
}
