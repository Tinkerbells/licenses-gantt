import * as React from 'react'
import { Route, Routes } from 'react-router'
import { Spin } from '@tinkerbells/xenon-ui'

import { root } from '@/shared/router'
import { LicenseGanttChart } from '@/view/gantt/gantt-chart'

import { Layout } from './layout'

export function AppRouter() {
  return (
    <React.Suspense fallback={<Spin fullscreen />}>
      <Routes>
        <Route path={root.$path()} element={<Layout />}>
          <Route path={root.chart.$path()} element={<LicenseGanttChart />} />
        </Route>
      </Routes>
    </React.Suspense>
  )
}
