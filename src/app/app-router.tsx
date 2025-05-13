import * as React from 'react'
import { Spin } from '@tinkerbells/xenon-ui'
import { Route, Routes } from 'react-router'

import { root } from '@/shared/router'
import { Home } from '@/view/home/home'
import { Status } from '@/view/status/status'

import { Layout } from './layout'

export function AppRouter() {
  return (
    <React.Suspense fallback={<Spin fullscreen />}>
      <Routes>
        <Route path={root.$path()} element={<Layout />}>
          <Route path={root.$path()} element={<Home />} />
          <Route path={root.status.$path()} element={<Status />} />
        </Route>
      </Routes>
    </React.Suspense>
  )
}
