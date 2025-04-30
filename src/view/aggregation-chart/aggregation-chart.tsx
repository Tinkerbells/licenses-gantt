import './aggregation-chart.styles.css'
import { Card } from '@tinkerbells/xenon-ui'
import { LineChart } from '@tinkerbells/xenon-charts'

const lineChartBaseOptions: Highcharts.Options = {
  chart: {
    type: 'line',
    height: `${(226 / 701) * 100}%`,
  },
  title: false,
  subtitle: false,
  series: [
    {
      type: 'line',
      marker: {
        enabled: false,
      },
      name: 'Item 1',
      data: [
        {
          x: 1672531200000,
          y: 226,
        },
        {
          x: 1675209600000,
          y: 246,
        },
        {
          x: 1677628800000,
          y: 489,
        },
        {
          x: 1680307200000,
          y: 491,
        },
        {
          x: 1682899200000,
          y: 142,
        },
        {
          x: 1685577600000,
          y: 644,
        },
        {
          x: 1688169600000,
          y: 374,
        },
      ],
    },
    {
      type: 'line',
      marker: {
        enabled: false,
      },
      name: 'Item 2',
      data: [
        {
          x: 1672531200000,
          y: 341,
        },
        {
          x: 1675209600000,
          y: 583,
        },
        {
          x: 1677628800000,
          y: 249,
        },
        {
          x: 1680307200000,
          y: 87,
        },
        {
          x: 1682899200000,
          y: 471,
        },
        {
          x: 1685577600000,
          y: 458,
        },
        {
          x: 1688169600000,
          y: 210,
        },
      ],
    },
    {
      type: 'line',
      marker: {
        enabled: false,
      },
      name: 'Item 3',
      data: [
        {
          x: 1672531200000,
          y: 86,
        },
        {
          x: 1675209600000,
          y: 682,
        },
        {
          x: 1677628800000,
          y: 653,
        },
        {
          x: 1680307200000,
          y: 390,
        },
        {
          x: 1682899200000,
          y: 22,
        },
        {
          x: 1685577600000,
          y: 244,
        },
        {
          x: 1688169600000,
          y: 389,
        },
      ],
    },
    {
      type: 'line',
      marker: {
        enabled: false,
      },
      name: 'Item 4',
      data: [
        {
          x: 1672531200000,
          y: 103,
        },
        {
          x: 1675209600000,
          y: 334,
        },
        {
          x: 1677628800000,
          y: 270,
        },
        {
          x: 1680307200000,
          y: 244,
        },
        {
          x: 1682899200000,
          y: 84,
        },
        {
          x: 1685577600000,
          y: 45,
        },
        {
          x: 1688169600000,
          y: 652,
        },
      ],
    },
    {
      type: 'line',
      marker: {
        enabled: false,
      },
      name: 'Item 5',
      data: [
        {
          x: 1672531200000,
          y: 548,
        },
        {
          x: 1675209600000,
          y: 337,
        },
        {
          x: 1677628800000,
          y: 442,
        },
        {
          x: 1680307200000,
          y: 272,
        },
        {
          x: 1682899200000,
          y: 681,
        },
        {
          x: 1685577600000,
          y: 104,
        },
        {
          x: 1688169600000,
          y: 227,
        },
      ],
    },
    {
      type: 'line',
      marker: {
        enabled: false,
      },
      name: 'Item 6',
      data: [
        {
          x: 1672531200000,
          y: 332,
        },
        {
          x: 1675209600000,
          y: 228,
        },
        {
          x: 1677628800000,
          y: 482,
        },
        {
          x: 1680307200000,
          y: 19,
        },
        {
          x: 1682899200000,
          y: 396,
        },
        {
          x: 1685577600000,
          y: 544,
        },
        {
          x: 1688169600000,
          y: 121,
        },
      ],
    },
    {
      type: 'line',
      marker: {
        enabled: false,
      },
      name: 'Item 7',
      data: [
        {
          x: 1672531200000,
          y: 119,
        },
        {
          x: 1675209600000,
          y: 85,
        },
        {
          x: 1677628800000,
          y: 662,
        },
        {
          x: 1680307200000,
          y: 84,
        },
        {
          x: 1682899200000,
          y: 505,
        },
        {
          x: 1685577600000,
          y: 260,
        },
        {
          x: 1688169600000,
          y: 217,
        },
      ],
    },
  ],
  xAxis: {
    tickPixelInterval: 60,
    type: 'datetime',
    labels: {
      format: '{value:%Y-%m}',
    },
  },
  yAxis: {
    title: {
      text: '',
    },
    tickPixelInterval: 50,
  },
}

export function AggregationChart() {
  return (
    <Card title="Агрегация, т.р." className="aggregation-chart" size="small">
      <LineChart options={lineChartBaseOptions} />
    </Card>
  )
}
