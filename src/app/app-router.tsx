import * as React from 'react'
import { Route, Routes } from 'react-router'
import { Spin } from '@tinkerbells/xenon-ui'

import { root } from '@/shared/router'
import { Home } from '@/view/home/home'

import { Layout } from './layout'

export function AppRouter() {
  return (
    <React.Suspense fallback={<Spin fullscreen />}>
      <Routes>
        <Route path={root.$path()} element={<Layout />}>
          <Route path={root.chart.$path()} element={<Home />} />
        </Route>
      </Routes>
    </React.Suspense>
  )
}
